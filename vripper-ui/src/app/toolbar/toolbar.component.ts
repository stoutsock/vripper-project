import { Component, OnInit, NgZone, OnDestroy, ChangeDetectionStrategy, EventEmitter, AfterViewInit } from '@angular/core';
import { RemoveAllResponse } from '../common/remove-all-response.model';
import { ServerService } from '../server-service';
import { AppService } from '../app.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatDialog } from '@angular/material';
import { ConfirmDialogComponent } from '../common/confirmation-component/confirmation-dialog';
import { filter, flatMap } from 'rxjs/operators';
import { LoggedUser } from '../common/logged-user.model';
import { SettingsComponent } from '../settings/settings.component';
import { Observable, Subscription } from 'rxjs';
import { BreakpointState, Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { WsConnectionService } from '../ws-connection.service';
import { WsHandler } from '../ws-handler';
import { WSMessage } from '../common/ws-message.model';
import { CMD } from '../common/cmd.enum';
import { SelectionService } from '../selection-service';
import { RowNode } from 'ag-grid-community';
import { RemoveResponse } from '../common/remove-response.model';
import { PostsDataService } from '../posts-data.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent implements OnInit, OnDestroy, AfterViewInit {

  constructor(
    private serverService: ServerService,
    private appService: AppService,
    private ngZone: NgZone,
    private httpClient: HttpClient,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private ws: WsConnectionService,
    private selectionService: SelectionService,
    private postsDataService: PostsDataService
  ) {
    this.websocketHandlerPromise = this.ws.getConnection();
  }

  loggedUser: EventEmitter<LoggedUser> = new EventEmitter();
  isExtraSmall: Observable<BreakpointState> = this.breakpointObserver.observe(Breakpoints.XSmall);
  websocketHandlerPromise: Promise<WsHandler>;
  subscriptions: Subscription[] = [];
  selected: RowNode[] = [];
  disableSelection: EventEmitter<boolean> = new EventEmitter();

  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '70%',
      height: '70%',
      maxWidth: '100vw',
      maxHeight: '100vh'
    });

    const smallDialogSubscription = this.isExtraSmall.subscribe(result => {
      if (result.matches) {
        dialogRef.updateSize('100%', '100%');
      } else {
        dialogRef.updateSize('70%', '70%');
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      smallDialogSubscription.unsubscribe();
    });
  }

  scan() {
    this.appService.scan();
  }

  search(event) {
    this.postsDataService.search(event);
  }

  remove() {
    const toRemove = [];
    this.selected.forEach(e => toRemove.push(e.data.postId));
    this.dialog
      .open(ConfirmDialogComponent, {
        maxHeight: '100vh',
        maxWidth: '100vw',
        height: '200px',
        width: '60%',
        data: { header: 'Confirmation', content: 'Are you sure you want to remove the selected items ?' }
      })
      .afterClosed()
      .pipe(
        filter(e => e === 'yes'),
        flatMap(e =>
          this.httpClient.post<RemoveResponse[]>(this.serverService.baseUrl + '/post/remove', toRemove)
        )
      )
      .subscribe(
        data => {
          this.postsDataService.remove(data);
        },
        error => {
          console.error(error);
        }
      );
  }

  restart() {
    const toStart = [];
    this.selected.forEach(e => toStart.push(e.data.postId));
    this.httpClient.post(this.serverService.baseUrl + '/post/restart', toStart).subscribe(
      () => {
        this._snackBar.open('Download started', null, {
          duration: 5000
        });
      },
      error => {
        console.error(error);
      }
    );
  }

  stop() {
    const toStop = [];
    this.selected.forEach(e => toStop.push(e.data.postId));
    this.httpClient.post(this.serverService.baseUrl + '/post/stop', toStop).subscribe(
      () => {
        this._snackBar.open('Download stopped', null, {
          duration: 5000
        });
      },
      error => {
        console.error(error);
      }
    );
  }

  clear() {
    this.ngZone.run(() => {
      this.httpClient.post<RemoveAllResponse>(this.serverService.baseUrl + '/post/clear/all', {}).subscribe(
        data => {
          this._snackBar.open(`${data.removed} items cleared`, null, { duration: 5000 });
        },
        error => {
          this._snackBar.open(error.error, null, {
            duration: 5000
          });
        }
      );
    });
  }

  removeAll() {
    this.ngZone.run(() => {
      this.dialog
        .open(ConfirmDialogComponent, {
          maxHeight: '100vh',
          maxWidth: '100vw',
          height: '200px',
          width: '60%',
          data: { header: 'Confirmation', content: 'Are you sure you want to remove all items ?' }
        })
        .afterClosed()
        .pipe(
          filter(e => e === 'yes'),
          flatMap(e => this.httpClient.post<RemoveAllResponse>(this.serverService.baseUrl + '/post/remove/all', {}))
        )
        .subscribe(
          data => {
            this._snackBar.open(`${data.removed} items removed`, null, { duration: 5000 });
          },
          error => {
            this._snackBar.open(error.error, null, {
              duration: 5000
            });
          }
        );
    });
  }

  stopAll() {
    this.ngZone.run(() => {
      this.httpClient.post(this.serverService.baseUrl + '/post/stop/all', {}).subscribe(
        () => {
          this._snackBar.open(`Download stopped`, null, { duration: 5000 });
        },
        error => {
          this._snackBar.open(error.error, null, {
            duration: 5000
          });
        }
      );
    });
  }

  restartAll() {
    this.ngZone.run(() => {
      this.httpClient.post(this.serverService.baseUrl + '/post/restart/all', {}).subscribe(
        () => {
          this._snackBar.open(`Download started`, null, { duration: 5000 });
        },
        error => {
          this._snackBar.open(error.error, null, {
            duration: 5000
          });
        }
      );
    });
  }

  ngAfterViewInit(): void {
    this.ngZone.run(() => {
      this.disableSelection.next(true);
      this.loggedUser.emit(new LoggedUser(null));
    });
  }

  ngOnInit() {
    this.websocketHandlerPromise.then((handler: WsHandler) => {
      console.log('Connecting to user stream');
      this.subscriptions.push(
        handler.subscribeForUser((e: LoggedUser[]) => {
          this.ngZone.run(() => {
            this.loggedUser.emit(e[0]);
          });
        })
      );
      handler.send(new WSMessage(CMD.USER_SUB.toString()));
    });

    this.selectionService.selected$.subscribe(selected => {
      this.selected = selected;
      this.ngZone.run(() => this.disableSelection.next(this.selected.length === 0));
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(e => e.unsubscribe());
  }
}
