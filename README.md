# Weather API

A repo with a data ingestion node process, that retrieves meteorological data from an external api and stores them to a MongoDB instance.

## Repo structure
> server

A feathersjs server that creates a mongo database and handles all the crud operations towards it.
Swagger ui is created, so all endpoint are available at `http://localhost:3030/docs`

> node

A nodejs process that acts as a data ingestion service.


## Getting started
- clone this repo

The intended ways to run this project are:
- DEV
  - have mongo running in you machine
  - run `npm install` in both `./server` and `./node`
  - run `npm run dev` in both `./server` and `./node`
  - the server is available at `http://localhost:3030`
  - api description is available at `http://localhost:3030/docs`

- PROD
  - have docker running in you machine (mongo is dockerised, no need for mongo in your machine)
  - run `docker compose up` from `root`
  - the server is available at `http://localhost:3030`
  - api description is available at `http://localhost:3030/docs`

## Server

### Features
  - Mongo database called `weather` at `27017`
  - Devices service exposed at `/devices` REST and websocket support
  - Weather service exposed at `/weather` REST and websocket support
  - `flows` adn `steps` services relevant to our data ingestion node process
  - All crud operations create events available to all machines connected to our server through websocket (further configuration possible at channels.ts)

## Node

### Features
  - Single process, possible extendability to multiple processes with a worker slave pattern or others
  - Connection to BE works with `feathers client` that allows access to all our server services
  - The process runs `flows` that run `steps` on parallel and circular mode, possible extendability to other modes (e.g. pipeline)
  - Flows can be repeatable and delayed,
  - They can be triggered from server driven events (currently weather flow has this functionality)
  - Flow status can be `'pending' | 'complete' | 'error' | 'running'`;
  - Steps can be delayed and skipped
  - Step status `'pending' | 'complete' | 'error' | 'running' | 'skipped'`;
  - Flows and steps store their status in mongo
  - Flows clear db entries of flows and steps for old data
  - Flows and Steps implement `hooks` that mimic the feathersjs patterns. Before hooks run before main execution and after hooks get as param the output of the main execution. Hooks are chained so that the returned value of one is the param of the next.
  - Process is not crashing if flow crashed. Flow is not crashing if a step crushed
