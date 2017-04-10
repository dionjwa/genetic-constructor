# Docker and Docker Compose

The Genetic Constructor application is deployed using Docker and `docker-compose`. Multiple compose configuration files are provided for different use cases.

### Base Application "webapp"

* `docker-compose.yml`
*  defines mocked-authentication run command
*  default location for most pass-thru environment variables

Provided for extension; not intended to be used directly 

### Local

* `docker-compose-local.yml`
* Extends `webapp` from `docker-compose.yml`
* Expose port 3000 for webapp explicitly
* Defines PostgreSQL `db` and `redis` images with links
* GC Storage is run inside GC App
* Mocked User Auth

Use to run the application locally within Docker

### Jenkins

* `docker-compose-jenkins.yml`
* Extends `webapp` from `docker-compose.yml`
* No external ports required
* Defines Jenkins test command w/ mounted volume for test output
* Extends `db` and `redis` from `docker-compose-local.yml` and links them
* GC Storage is run inside GC App
* Mocked User Auth

Use to run unit tests in Docker and have output copied back to working directory

### Base AWS Application

* `docker-compose-aws.yml`
* Extends `webapp` from `docker-compose.yml`
* Introduces environment variables required for AWS deployments
   * Pass-thru for AWS based resources, i.e. Storage, Auth, Redis
* Overwrites run command to use real authentication
* Enables container restarts

Provided for extension; not intended to be used directly 

### Batch Processing

* `docker-compose-batch.yml`
* Defines `batch` container by extending `webapp` from `docker-compose-aws.yml`
* No external ports required
* Run infinite loop command
* Access Storage, Auth, DB, and Redis in target environment

### Dev and QA Environments

* `docker-compose-quickstart.yml`
* Extends `webapp` from `docker-compose-aws.yml`
* Expose port `3000` for `webapp` explicitly 
* Real User Auth Enabled
* Access Storage, Auth, DB, and Redis in target environment

### Feature Environment

* `docker-compose-feature-quickstart.yml`
* Extends `webapp` from `docker-compose-aws.yml`
* Expose port `3333` for `webapp` explicitly 
* Like `docker-compose-quickstart.yml` but:
   * Exposes a different `PORT`
   * Sets a different `HOST_URL`

### Prod Environment

* `docker-compose-production.yml`
* Extends `webapp` from `docker-compose-quickstart.yml`
* `REG_ALERT_EMAIL` and `REG_ALERT_SUBJECT` enabled
* `HOST_URL` is set to hostname w/o environment tag

### ECS

* `docker-compose-quickstart-ecs.yml`
* Extends `webapp` from `docker-compose-aws.yml`
* *ONLY FOR Dev and QA RIGHT NOW*
* like Dev and QA expect:
   * specify memory size
   * no exposed ports
