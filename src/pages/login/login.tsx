import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../store";
import { loginDemoUser, loginUser } from "../../store/login/login.reducer";
import { getStoredToken, hasAcceptedRules } from "../../utils/authStorage";
import "./login.scss";

function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { token, loading, error, successMessage } = useAppSelector(
    (state) => state.loginReducer,
  );

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) return;

    navigate(hasAcceptedRules() ? "/dashboard/home" : "/rules", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (token) {
      toast.success(successMessage || "Login successful!");
      navigate("/rules");
    }
  }, [token, successMessage, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleLogin = () => {
    if (!username.trim()) {
      toast.error("Please enter username.");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter password.");
      return;
    }

    dispatch(
      loginUser({
        username,
        password,
      }),
    );
  };

  const handleDemoLogin = () => {
    dispatch(loginDemoUser());
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-circle">D</div>
        </div>

        <h1>Welcome Back</h1>

        <p className="subtitle">Login to continue your trading journey</p>

        <div className="form-group">
          <label>Username</label>

          <input
            type="text"
            placeholder="demo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login to Account"}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="demo-btn" onClick={handleDemoLogin} disabled={loading}>
          Try Demo Account
        </button>

        <div className="signup-text">
          Accounts are created by Super Admin, Admin, Sub Admin, or Master.
        </div>

        <div className="links">
          <a href="#">Terms & Conditions</a>
          <span>|</span>
          <a href="#">Privacy Policy</a>
        </div>

        <div className="footer-note">
          THIS APPLICATION IS FOR TRAINING PURPOSE ONLY.
        </div>
      </div>
    </div>
  );
}

export default Login;
