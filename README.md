# Warning!

This library is quite fresh and still under development.

Currently, it supports only one type of authentication method, which is Firebase JWT token.

This library is intended to be simple replacement for [axios](https://www.npmjs.com/package/axios). It's much smaller in size and supports most basic needs for handling api requests.

Please note, it's planned to make this library more sophisticated in time.

## Usage

```
import { ApiRequest } from "@narisolutions/api-request";

const api = new ApiRequest( {...} );

const getUsers = () => {
    try {
        const users = await api.CALL("GET", "/users");
    }catch(e) {
        ...
    }

}

```

#### TypeScript

```
import { ApiRequest } from "@narisolutions/api-request";

const api = new ApiRequest( {...} );

type User {
    name: string;
    age: number;
}

const getUsers = () => {
    try {
        const users = await api.CALL<User[]>("GET", "/users");
    }catch(e) {
        ...
    }

}

```
