# Time Management App (Backend)

This is the backend for a time management App. You can also check the [frontend project](https://github.com/danielfaleiro/time-management-app-frontend).

## How to install

Run:
```bash
$ npm install
```

## Enviroment variables

In order to run this project, it is also necessary to set up 3 enviroment variables. You can create a `.env` file in the root with the following content:

```
PORT=< port >
MONGO_URI=< mongodb-srv-url >
SECRET=< secret >
```

- < port > refers to the port the server will listen to.
- < mongodb-srv-url > refers to mongodb cloud database url. You can have more info about it on their [official website](https://www.mongodb.com/cloud/atlas).
- < secret > refers to a hash string used by jwt to encrypt and verify tokens.

## Run

After configuring `.env` file, you can finally run it:

```bash
$ npm start
```

## Summary

Time Management App allows you to add and manage tasks. You can set a prefered daily hours to work. The app shows which days you have met your hours goal or not.

- Regular users can CRUD tasks.
- User managers can CRUD his/her own tasks and other users (except for Admins).
- Admins can CRUD all tasks and all users.

