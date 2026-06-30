# Hide and Seek - Web Application

A modern dark-themed web application with user authentication, profiles, and interactive features.

## Features

- **User Authentication**: SHA256 double-hashed password security
- **User Profiles**: Upload and customize profile avatars
- **Rank System**: Owner (red), Beta Tester (yellow), User (green)
- **Interactive Button**: Plays whistle sound at full volume
- **Countdown Timer**: Owner-only feature, synchronized across users
- **Responsive Design**: Works perfectly on all devices
- **Dark Theme**: Modern dark interface

## Default Accounts

| Username | Password | Rank |
|----------|----------|------|
| admin | admin123 | Owner |
| beta1 | beta123 | Beta Tester |
| user1 | user123 | User |

## GitHub Pages Deployment

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages
4. Under "Source", select "Deploy from a branch"
5. Choose the main branch and / (root) folder
6. Click "Save"

Your site will be available at `https://<username>.github.io/<repository>/`

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- CryptoJS (for password hashing)
- DiceBear (for default avatars)
