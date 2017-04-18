# Inherit from ubuntu docker image
FROM node:boron

MAINTAINER bionanodevops@autodesk.com # 2017-04-13

ENV CXX g++-4.9
RUN apt-get dist-upgrade -y
RUN apt-get update -y
RUN apt-get upgrade -y

RUN apt-get install -y software-properties-common
RUN apt-get install -y curl git build-essential wget
RUN apt-get install -y python python-dev python-pip
RUN pip install awscli
RUN pip install biopython

RUN	apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /app
WORKDIR /app

#setup node
ADD package.json /app/package.json
ADD storage-ext /app/storage-ext
# explicitly control which scripts run 
RUN npm install
# Steps below mirroring *some* of the postinstall scripts (skipping extensions and selenium)
# ASSUME THIS HAS BEEN RUN before building this Docerfile. Extension pulled in via ADD statement below
# RUN npm run install-extensions || true

ADD . /app
RUN cd /app

RUN npm run jsdoc

# Redis now launch via docker-compose and is referenced via link
CMD  ["npm" , "run", "start-instance"]
