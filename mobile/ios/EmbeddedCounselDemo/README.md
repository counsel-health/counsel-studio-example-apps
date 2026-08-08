# iOS Mobile Demo App

[Public TestFlight Link](https://testflight.apple.com/join/mseSbfQG). Reach out to get an access code. We're here to help at support@counselhealth.com!

### 🖥️ Running in the iOS Simulator

1. **Install Xcode 16.0+**

2. **Clone the repo and open the project in Xcode**

```bash
git clone https://github.com/counsel-health/counsel-studio-example-apps.git
cd counsel-studio-example-apps/mobile
open EmbeddedCounselDemo.xcodeproj
```

3. **Select a Simulator device**

* In the Xcode toolbar near the top, click the device selector.
* Choose a device (e.g., iPhone 16 Pro).

4. **Run the app**

* Click the ▶️ Run button or press `Cmd + R`.
* Xcode will build and launch the app in the Simulator.

### Uploading to TestFlight

1. In Xcode, update simulator choice to `Any iOS Device (arm64)` on the top bar.
2. For each app build, always increment the build number (select project from left navigation panel and update under Identity). Version number can be incremented as you see fit (e.g., major version for new features, minor version for bug fixes).
2. Select Product > Archive to create an app build.
3. A new Organizer window will show up if it succeeded. Select `Distribute app`.
4. Select `TestFlight Internal Only`.
5. Once your app has been successfully uploaded, you can go to App Store Connect under TestFlight to see the build processing.
6. Once the build has finished processing (usually takes 5-20 minutes), you'll need to update `Missing Compliance` to be `No algorithms`.
7. Your TestFlight build is ready for testing!
8. Make sure to commit and push up version and build number updates.

Note: to update who gets access to TestFlight, add or remove users under the `Internal Employees` group. This can be modified within App Store Connect.
