You are a senior React Native developer and UI/UX animation expert.

Create a FULLY FUNCTIONAL, PRODUCTION-READY Tamil Nadu PDS Beneficiary Mobile App using React Native CLI (NOT Expo).

Backend is already ready.

Base URL:

http://localhost:5000/api


======================================================
CORE REQUIREMENTS
======================================================

This app must feel like a PREMIUM MODERN APP similar to:

VI App
YouTube App
Google Pay
Swiggy
Zomato

Focus heavily on:

Smooth animations
Micro-interactions
Skeleton loading
Theme support
Premium UI


======================================================
TECH STACK
======================================================

React Native CLI

Libraries:

@react-navigation/native
@react-navigation/stack
@react-navigation/bottom-tabs

react-native-reanimated
react-native-gesture-handler
react-native-screens

react-native-vector-icons

react-native-paper

lottie-react-native

react-native-skeleton-placeholder

@react-native-async-storage/async-storage

axios


======================================================
ANIMATION REQUIREMENTS (VERY IMPORTANT)
======================================================


------------------------------------------------------
1. Splash Animation (VI / YouTube Style)
------------------------------------------------------

Create premium intro animation:

Sequence:

App Logo appears small in center

Scale animation to large

Fade background color

Logo moves to top

Then navigate to Login / Dashboard

Use:

Reanimated or Lottie

Duration:

2 seconds

Smooth easing

60fps


------------------------------------------------------
2. Screen Transition Animations
------------------------------------------------------

Use custom navigation animation:

Fade + Slide

Not default navigation animation

Premium smooth transition


------------------------------------------------------
3. Skeleton Loading Animation
------------------------------------------------------

When loading data show skeleton:

For:

Dashboard cards
Quota screen
Transactions list
Profile

Use:

react-native-skeleton-placeholder

Example:

Grey animated placeholder

Not spinner

Must look modern like YouTube


------------------------------------------------------
4. Micro-Interactions (VERY IMPORTANT)
------------------------------------------------------

Add interactions like modern apps:


Button press animation:

Scale down on press
Scale up on release


Card press animation:

Lift effect
Shadow increase


Tab press animation:

Icon scale animation


List items:

Fade + slide animation when appearing


Pull to refresh:

Smooth animation


------------------------------------------------------
5. Interactive Animations
------------------------------------------------------

Dashboard cards:

When opening screen:

Cards animate:

Fade in
Slide up
Stagger animation


Transaction list:

Items appear one by one animation


Quota progress bars:

Animate width from 0 to actual value


------------------------------------------------------
6. Receipt Screen Animation
------------------------------------------------------

When opening receipt:

Fade in

Scale animation

Like opening a paper


======================================================
THEME SUPPORT (LIGHT + DARK)
======================================================

Must support:

Light theme
Dark theme


Auto detect system theme

Use:

react-native-paper theme system


Also allow manual toggle


Theme must affect:

Background
Text
Cards
Buttons
Status bar


Dark theme must look premium

Not just black


======================================================
SCREENS
======================================================


Splash Screen
Login Screen
Dashboard Screen
Monthly Quota Screen
Transactions Screen
Transaction Details Screen
Shop Stock Screen
Profile Screen


======================================================
DASHBOARD UI
======================================================

Show cards:

Monthly Quota
Transactions
Shop Stock
Profile

Animated cards

Modern gradient cards

Rounded corners

Shadow


======================================================
TRANSACTION SCREEN
======================================================

Animated list

Skeleton loader

Receipt open animation


======================================================
LOGIN SCREEN
======================================================

Animated input fields

Floating labels

Button animation

Error animation shake effect


======================================================
LOGOUT ANIMATION
======================================================

When logout:

Fade out animation

Navigate to login


======================================================
TOKEN STORAGE
======================================================

Store token using AsyncStorage


======================================================
FOLDER STRUCTURE
======================================================

src/

screens/
components/
navigation/
services/
animations/
theme/
utils/
assets/


======================================================
ANIMATION FILES
======================================================

Create reusable animations:

FadeInView
ScaleButton
SkeletonLoader
AnimatedCard


======================================================
UI QUALITY REQUIREMENT
======================================================

This must look like production app

NOT beginner UI


======================================================
OUTPUT REQUIRED
======================================================

Full project

All files

Ready to run:

npm install

npx react-native run-android


======================================================
IMPORTANT
======================================================

Backend already exists

DO NOT create backend


Focus on best UI, animation, skeleton, and themes


======================================================
