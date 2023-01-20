FROM maven:3.8.7-amazoncorretto-17 AS build

RUN mkdir /build
COPY . /build

WORKDIR /build
RUN mvn package -Dmaven.test.skip=true


FROM amazoncorretto:11 AS run

ARG VERSION
ENV VERSION=${VERSION:-3.5.5}
ENV JAR_FILE=vripper-server-${VERSION}-web.jar
ENV VRIPPER_DIR=/vripper
ENV DOWNLOAD_DIR=/downloads

RUN mkdir -p ${VRIPPER_DIR}
COPY --from=build /build/vripper-server/target/${JAR_FILE} ${VRIPPER_DIR}
RUN mkdir -p ${DOWNLOAD_DIR}

EXPOSE 8080/tcp

CMD java -Dbase.dir.name=${VRIPPER_DIR}/data -Duser.home=${DOWNLOAD_DIR} -jar ${VRIPPER_DIR}/${JAR_FILE}
