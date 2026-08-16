import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getStoredToken, hasAcceptedRules } from "../../utils/authStorage";
import "./rules.scss";

function Rules() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const token = getStoredToken();

  useEffect(() => {
    if (token && hasAcceptedRules()) {
      navigate("/dashboard/home", { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const handleContinue = () => {
    localStorage.setItem("rulesAccepted", "true");
    navigate("/dashboard/home");
  };

  const rules = [
    "Dpasa is only for education purpose.",
    "Market Environment. The sole purpose is to learn basics of stock market.",
    "Developer, Owner or any other party does not take responsibility for any type of monetary transaction on Dpasa web/application as this is only for testing/learning purpose.",
    "Fresh Limit & Midlimits are not allowed.",
    "Both bid and stop loss are not allowed simultaneously, one of them will be removed.",
    "Dpasa reserves the right to cancel/remove any default trades.",
    "Dpasa reserves the right to charge a round trip brokerage, interest & spread if position and holding time exceeds 10 days for NSE, 5 days for MCX.",
    "If line trades are found in an ID, it will be removed.",
    "Short time trades closed within 20 minutes of opening will be voided of Profit.",
  ];

  return (
    <div className="rules-container">
      <div className="rules-card">
        <div className="rules-header">
          <h2>📜 Rules & Regulations</h2>
          <p>Please read carefully before continuing</p>
        </div>

        <div className="rules-list">
          {rules.map((rule, index) => (
            <div className="rule-item" key={index}>
              <span className="check-icon">✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>

        <div className="rules-footer">
          <div className="accept-section">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />

            <label>I have read and agree to the rules</label>
          </div>

          <button disabled={!accepted} onClick={handleContinue}>
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default Rules;
