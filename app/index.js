import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import App from "./App";
import { widgetTaskHandler } from "./src/widget/widgetTaskHandler";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and works whether the app is loaded in Expo Go or a native/dev-client build.
registerRootComponent(App);

// Lets Android call back into JS whenever the widget needs to be
// added/updated/resized/removed, or one of its clickable areas is tapped.
registerWidgetTaskHandler(widgetTaskHandler);
