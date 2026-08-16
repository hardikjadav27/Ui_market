import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { protectedResources } from "../../authConfig";
import { CreateUserRequest, User } from "../../Interfaces/User";

interface UserState {
  users: User[];
  loading: boolean;
}

const initialState: UserState = {
  users: [],
  loading: false,
};

export const getUsers = createAsyncThunk(
  "users/getUsers",
  async (query: string) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${protectedResources.userAPI.endpoint}?${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.json();
  },
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (payload: CreateUserRequest) => {
    const token = localStorage.getItem("token");
    const response = await fetch(protectedResources.userAPI.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Failed to create user.");
    }
    return data;
  },
);

export const userReducer = createSlice({
  name: "userReducer",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUsers.fulfilled, (state, action) => {
      state.users = action.payload.data;
    });

    builder.addCase(createUser.fulfilled, (state, action) => {
      if (action.payload?.data) {
        state.users = [...(state.users || []), action.payload.data];
      }
    });
  },
});

export default userReducer.reducer;
