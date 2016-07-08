# Dredd Tests
## Fail: GET /api/users
### Message
```
body: At '' Invalid type: object (expected array)
statusCode: Status code is not '200'

```

### Request
```
method: GET
uri: /api/users
headers: 
    Authorization: Superuser
    User-Agent: Dredd/1.2.0 (Darwin 15.5.0; x64)

body: 


```

### Expected
```
headers: 
    Content-Type: application/json; charset=utf-8

body: 
[
    {
        "id": 42,
        "firstName": "Richard",
        "lastName": "Plotkin",
        "isSuperuser": false
    },
    {
        "id": 1010,
        "firstName": "Alexei",
        "lastName": "Ledenev",
        "isSuperuser": false
    }
]

statusCode: 200

```

### Actual
```
statusCode: 401
headers: 
    x-powered-by: Express
    content-type: application/json; charset=utf-8
    content-length: 98
    etag: W/"62-DL0fV3/AxFr9QCGOTvp6mg"
    date: Fri, 08 Jul 2016 14:04:02 GMT
    connection: close

body: 
{"name":"AuthenticationError","message":"Unauthorized","text":"AuthenticationError: Unauthorized"}

```

## Pass: GET /api/users
## Pass: POST /api/users
## Fail: GET /api/users/42
### Message
```
body: At '/id' Missing required property: id
body: At '/firstName' Missing required property: firstName
body: At '/lastName' Missing required property: lastName
body: At '/isSuperuser' Missing required property: isSuperuser
body: At '/emails' Missing required property: emails
statusCode: Status code is not '200'

```

### Request
```
method: GET
uri: /api/users/42
headers: 
    Authorization: Superuser
    User-Agent: Dredd/1.2.0 (Darwin 15.5.0; x64)

body: 


```

### Expected
```
headers: 
    Content-Type: application/json; charset=utf-8

body: 
{
    "id": 42,
    "firstName": "Richard",
    "lastName": "Plotkin",
    "isSuperuser": false,
    "emails": [
        "richard.plotkin@toptal.com",
        "richardjplotkin@gmail.com"
    ]
}

statusCode: 200

```

### Actual
```
statusCode: 401
headers: 
    x-powered-by: Express
    content-type: application/json; charset=utf-8
    content-length: 98
    etag: W/"62-DL0fV3/AxFr9QCGOTvp6mg"
    date: Fri, 08 Jul 2016 14:04:02 GMT
    connection: close

body: 
{"name":"AuthenticationError","message":"Unauthorized","text":"AuthenticationError: Unauthorized"}

```

## Pass: GET /api/users/42
## Fail: PUT /api/users/42
### Message
```
body: At '/id' Missing required property: id
body: At '/firstName' Missing required property: firstName
body: At '/lastName' Missing required property: lastName
statusCode: Status code is not '200'

```

### Request
```
method: PUT
uri: /api/users/42
headers: 
    Content-Type: application/json
    User-Agent: Dredd/1.2.0 (Darwin 15.5.0; x64)
    Content-Length: 118

body: 
{
  "firstName": "Richard-Update",
  "lastName": "Plotkin-Update",
  "emails": [
    "richard@richardplotkin.com"
  ]
}

```

### Expected
```
headers: 
    Content-Type: application/json; charset=utf-8

body: 
    {
        "id": 42,
        "firstName": "Richard-Update",
        "lastName": "Plotkin-Update"
    }

statusCode: 200

```

### Actual
```
statusCode: 500
headers: 
    x-powered-by: Express
    content-type: application/json; charset=utf-8
    content-length: 88
    etag: W/"58-G+4yGkjUlmbOBpRljgiUtQ"
    date: Fri, 08 Jul 2016 14:04:02 GMT
    connection: close

body: 
{"name":"CustomError","message":"No Rows Updated","text":"CustomError: No Rows Updated"}

```

## Pass: DELETE /api/users/42
