# Snapshots API

The Genetic Constructor `Snapshot` API allows indexing or "tagging" specific versions of a [Project](./PROJECTS.md). All methods start with `/api/snapshots`.

A snapshot record possesses a unique `uuid` created by the RDBMS. Only one snapshot record can exist for a given `projectId` and `projectVersion`.

#### v0 schema

* `uuid` -> UUIDv1 for the snapshot record
* `owner` -> UUIDv1
* `message` -> Text (long String)
* `type` -> String
* `status` -> Integer: 0 -> **deleted**, 1-> **active**
* `tags` -> JSON
* `keywords` -> Array of Strings
* `projectUUID` -> UUIDv1 (`uuid` from the target project record)
* `projectId` -> String (`id` from the target project)
* `projectVersion` -> Integer (`version` from the target project)

#### Ownership

The owner of the snapshot must be the owner of the project record.

#### Creating Snapshots

`POST /api/snapshots`

Create a snapshot record by posting the snapshot metadata and the `projectId` of the target project. The latest version of the specified project will be used if `projectVersion` isn't provided in the post body.

All values are passed as one JSON object in the POST body.

```
{
  "owner": <ownerUUID>,
  "projectId": <projectId>,
  "message": "test snapshot v1",
  "type": "test",
  "tags": {
    "test": true,
    "hello": "kitty",
    "stuff": ["bing", "bang", "bong"],
    "worldSeries": "cubs",
    "version": "latest"
  },
  "keywords": ["mangle", "tangle"]
}
```

Returns the full snapshot object with fields populated by the RDBMS.

* Required: `owner`, `projectId`, `type`, `message`
* Optional: `keywords`, `tags`, `projectVersion`
* `keywords` will be converted to lowercase and de-duped
* Returns `404` if the specified `projectId` doesn't exist

#### Fetch Snapshots with ProjectId

Snapshots can be fetched by specifying the `projectId` they reference.

`GET /api/snapshots/:projectId`

Fetch all snapshots referencing the specified `projectId`

Returns an array of snapshot records.

* Optional `projectVersion` query string param can be provided to limit query to a specific version of a project.
* Returns `404` if no snapshots exist for the given `projectId`

---
`HEAD /api/snapshots/:projectId`

Check to see if any snapshots exist for the given `projectId`. Also allows an optional query string param `projectVersion` like the `GET` method. If one or more snapshots exist for the given `projectId` a HTTP header is included in the response for efficient, subsequent fetching.

* HTTP Response Headers
  * `Latest-Snapshot` -> `uuid` of the last snapshot created/updated for the specified `projectId` and optional `projectVersion`
* Returns `200` if no snapshots exist for the given `projectId`

#### Fetch Snapshot with Tags

Snapshots can be fetched by posting a JSON object to compare to the `tags` field of snapshot records.

`POST /api/snapshots/tags`

The post body should be the JSON to compare to the `tags` JSON field in the snapshot schema.

```
{
  "hello": kitty
}
```

The above example would match the `tags` value in the creation example above.

Returns an array of snapshot records.

* Returns 200 and an empty array if no Snapshots matched search parameters
* Employs JSON subset comparision. Does the target snapshot contain the key-value pairs in the post body? NOT strict object comparision.

* Optional `project` query string can be provided to limit query to a particular project

#### Fetch Snapshot with Keywords (and Tags if you want)

Snapshots can be fetched by posting a JSON object with a `keywords` array and optional `tags` object. Snapshots will be returned that contain the provided `keywords` and match the optionally-provided `tags`.

`POST /api/snapshots/keywords`

The post body should be the JSON to compare to the `tags` JSON field in the snapshot schema.

```
{
  "keywords": ["mangle"],
  "tags": {
    "hello": "kitty"
  }
}
```

The above example would match both the `keywords` and the `tags` value in the creation example above.

Returns an array of snapshot records.

* Returns 200 and an empty array if no Snapshots matched search parameters
* Employs the *IN* operator for the `keywords` provided. Does the target snapshot contain these keywords?
* Employs JSON subset comparision for `tags`. Does the target snapshot contain the key-value pairs in the post body? NOT strict object comparision.

* Optional `project` query string can be provided to limit query to a particular project

#### Fetch a Map of Snapshot Keyword Counts

Primarily to support type-ahead keyword input and Snapshot exploration, a map of keywords and their respective counts can be fetched with optional search parameters.

`POST /api/snapshots/kwm`

A post body is required but _CAN_ be empty. The following example shows all optional, supported search parameters.

```
{
  "projectId": "project-fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca",
  "keywords": ["tangle"],
  "tags": {
    "worldSeries": "cubs",
  },
}

```

Returns a map in which the `keys` are the unique `keyword` strings used in the Snapshots found by the query. The `values` are integers indicating the number of Snapshots containing the keyword.

* Returns 200 and an empty map if no Snapshots matched search parameters
* If a `projectId` string is provided, an exact match will be attempted.
* Employs the *IN* operator for the `keywords` provided. Does the target snapshot contain these keywords?
* Employs JSON subset comparision for `tags`. Does the target snapshot contain the key-value pairs in the post body? NOT strict object comparision.

#### Manage Snapshots with UUID

The unique snapshot `uuid` can be used to fetch and delete the snapshot.

`GET /api/snapshots/uuid/:uuid`

Fetch the snapshot record for the given snapshot `uuid`, return `404` if the `uuid` doesn't match any snapshots.

---
`DELETE /api/snapshots/uuid/:uuid`

The only way to delete a snapshot is to use the DELETE method with the snapshot `uuid`.

Returns a JSON object with the number of snapshots deleted to support the cascading delete functionality in the [Project](./PROJECTS.md) API.

```
{
  "numDeleted": 1
}
```

* Unlike the project DELETE API, snapshots can be permanently removed from the RDMBS using this API by specifying an optional query string param `destroy=true`. Otherwise the snapshot will be marked as deleted but not removed.
* Returns `404` if the `uuid` doesn't match any snapshot records.


