// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// // import { LoginRequest, LoginResponse } from "../../Interfaces/Login";
// import { protectedResources } from "../../authConfig";
// import { LoginRequest, LoginResponse } from "../../Interfaces/Login";

// interface LoginState {
//   loading: boolean;
//   token: string;
//   userName: string;
//   role: string;
//   error: string;
// }

// const initialState: LoginState = {
//   loading: false,
//   token: "",
//   userName: "",
//   role: "",
//   error: "",
// };

// export const loginUser = createAsyncThunk(
//   "login/loginUser",
//   async (payload: LoginRequest) => {
//     const response = await fetch(
//       `${protectedResources.authAPI.endpoint}/login`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       },
//     );

//     const data = (await response.json()) as LoginResponse;

//     return data;
//   },
// );

// export const loginReducer = createSlice({
//   name: "loginReducer",
//   initialState,
//   reducers: {
//     logout(state) {
//       state.token = "";
//       state.userName = "";
//       state.role = "";

//       localStorage.clear();
//     },
//   },
//   extraReducers: (builder) => {
//     builder

//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//       })

//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;

//         if (action.payload.success) {
//           state.token = action.payload.data.token;

//           state.userName = action.payload.data.username;

//           state.role = action.payload.data.role;

//           localStorage.setItem("token", action.payload.data.token);

//           localStorage.setItem("role", action.payload.data.role);

//           localStorage.setItem("userName", action.payload.data.username);
//         }
//       })

//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message || "Login Failed";
//       });
//   },
// });

// export const { logout } = loginReducer.actions;

// export default loginReducer.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { protectedResources } from "../../authConfig";
import { LoginRequest, LoginResponse } from "../../Interfaces/Login";
import { DEMO_USER, getRegisteredUsername, registerUser, type RegisterUserRequest } from "../../services/authApi";
import { readStoredAuth } from "../../utils/authStorage";

interface LoginState {
  loading: boolean;
  token: string;
  userName: string;
  fullName: string;
  role: string;
  error: string;
  successMessage: string;
}

const initialState: LoginState = {
  loading: false,
  token: readStoredAuth().token,
  userName: readStoredAuth().userName,
  fullName: readStoredAuth().fullName,
  role: readStoredAuth().role,
  error: "",
  successMessage: "",
};

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>("login/loginUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${protectedResources.authAPI.endpoint}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    // 🔴 IMPORTANT
    // API 401 / success false
    if (!response.ok || data.success === false) {
      return rejectWithValue(data.message || "Invalid username or password.");
    }

    return data;
  } catch (error) {
    return rejectWithValue("Unable to connect to server.");
  }
});

export const registerAndLogin = createAsyncThunk<
  LoginResponse,
  RegisterUserRequest,
  { rejectValue: string }
>("login/registerAndLogin", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const registration = await registerUser(payload);
    const username = getRegisteredUsername(registration, payload.email);

    const loginResult = await dispatch(
      loginUser({
        username,
        password: payload.password,
      }),
    );

    if (loginUser.fulfilled.match(loginResult)) {
      return loginResult.payload;
    }

    return rejectWithValue(
      (loginResult.payload as string) || "Account created but login failed.",
    );
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Registration failed.");
  }
});

export const loginDemoUser = createAsyncThunk<
  LoginResponse,
  void,
  { rejectValue: string }
>("login/loginDemoUser", async (_, { dispatch, rejectWithValue }) => {
  const result = await dispatch(
    loginUser({
      username: DEMO_USER.username,
      password: DEMO_USER.password,
    }),
  );

  if (loginUser.fulfilled.match(result)) {
    return result.payload;
  }

  return rejectWithValue(
    (result.payload as string) || "Demo login failed. Ask an upline to create the demo client.",
  );
});

export const loginReducer = createSlice({
  name: "loginReducer",
  initialState,

  reducers: {
    logout(state) {
      state.token = "";
      state.userName = "";
      state.fullName = "";
      state.role = "";
      state.error = "";
      state.successMessage = "";

      localStorage.clear();
    },

    clearLoginMessage(state) {
      state.error = "";
      state.successMessage = "";
    },

    hydrateFromStorage(state) {
      const auth = readStoredAuth();
      state.token = auth.token;
      state.userName = auth.userName;
      state.fullName = auth.fullName;
      state.role = auth.role;
    },
  },

  extraReducers: (builder) => {
    builder

      // LOGIN START
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })

      // LOGIN SUCCESS
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = "";

        if (action.payload.success && action.payload.data) {
          const user = action.payload.data as LoginResponse["data"] & {
            Token?: string;
            Username?: string;
            FullName?: string;
            Role?: string;
            Id?: number;
            RoleId?: number;
          };

          const token = user.token ?? user.Token ?? "";
          const username = user.username ?? user.Username ?? "";
          const fullName = user.fullName ?? user.FullName ?? "";
          const role = user.role ?? user.Role ?? "";
          const userId = user.id ?? user.Id ?? 0;
          const roleId = user.roleId ?? user.RoleId;

          state.token = token;
          state.userName = username;
          state.fullName = fullName;
          state.role = role;

          state.successMessage = action.payload.message || "Login successful.";

          localStorage.setItem("token", token);
          localStorage.setItem("role", role);
          localStorage.setItem("userName", username);
          localStorage.setItem("fullName", fullName);
          localStorage.setItem("userId", userId.toString());
          if (roleId !== undefined && roleId !== null) {
            localStorage.setItem("roleId", roleId.toString());
          }
        }
      })

      // LOGIN FAILED
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;

        state.error =
          (action.payload as string) || "Invalid username or password.";
      })

      .addCase(registerAndLogin.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(registerAndLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.successMessage = action.payload.message || "Account created.";
        }
      })
      .addCase(registerAndLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Registration failed.";
      })

      .addCase(loginDemoUser.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.successMessage = "";
      })
      .addCase(loginDemoUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.successMessage = "Demo account ready.";
        }
      })
      .addCase(loginDemoUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Demo login failed.";
      });
  },
});

export const { logout, clearLoginMessage, hydrateFromStorage } = loginReducer.actions;

export default loginReducer.reducer;
