import ReactDOM from "react-dom/client";
import App from "./App";

import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateFromStorage } from "./store/login/login.reducer";

store.dispatch(hydrateFromStorage());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
