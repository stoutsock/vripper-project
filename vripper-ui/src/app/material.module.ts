import { NgModule } from '@angular/core';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSnackBar,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule
} from '@angular/material';

@NgModule({
    exports: [
        MatButtonModule,
        MatCheckboxModule,
        MatProgressBarModule,
        MatToolbarModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatMenuModule,
        MatDialogModule,
        MatCardModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatTabsModule,
        MatDividerModule,
        MatChipsModule
    ],
    providers: [MatSnackBar]
})
export class MaterialModule { }
