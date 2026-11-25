# Smart Login System

A client-side registration and login system built with vanilla JavaScript.
Users create an account, sign in, and land on a personal welcome page - with a
real logout that clears the session. All data lives in localStorage; there is
no backend, so it is a learning project, not production auth.

**Live demo:** https://malakmo7amed309.github.io/smart-login/

## Screenshots

| Login | Register | Welcome |
| --- | --- | --- |
| ![Login](docs/screenshot-login.png) | ![Register](docs/screenshot-register.png) | ![Welcome](docs/screenshot-welcome.png) |

## Features

- Sign up with name, email and password
- Validation: required fields, email format, minimum password length
- Duplicate-email detection (case-insensitive)
- Login with inline error messages, no disruptive alerts
- Protected welcome page: redirects to login when nobody is signed in
- Logout clears the session

## Tech stack

- HTML5, CSS3
- Vanilla JavaScript (localStorage)
- Bootstrap 5 + Font Awesome

## Run locally

Open `index.html` in a browser. No build step.

## Author

Malak Mohamed - [GitHub](https://github.com/malakmo7amed309)
