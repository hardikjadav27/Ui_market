import "./UserEditModal.scss";

interface Props {
  user: any;
  onClose: () => void;
}

function UserEditModal({ user, onClose }: Props) {
  return (
    <div className="user-modal-overlay">
      <div className="user-modal">
        <div className="modal-top-menu">
          <button className="active">EDIT</button>
          <button>SETTLEMENT</button>
          <button>LEDGER</button>
          <button>TRADE</button>
          <button>STANDING</button>
          <button>LOGIN LOG</button>
          <button>SYMBOL LOG</button>
          <button>SYMBOL QTY</button>
          <button>GENERATE BILL</button>

          <button className="close-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <div className="modal-grid">
          {/* LEFT */}

          <div className="panel">
            <div className="field">
              <span>USERNAME</span>
              <strong>{user?.username}</strong>
            </div>

            <div className="field">
              <span>NAME</span>
              <strong>{user?.fullName}</strong>
            </div>

            <div className="field">
              <span>PASSWORD</span>
              <strong>********</strong>
            </div>

            <div className="field">
              <span>WALLET BALANCE</span>
              <strong>{user?.availableBalance ?? 0}</strong>
            </div>

            <div className="field">
              <span>SHARING</span>
              <strong>
                {user?.sharingRate != null ? `${(Number(user.sharingRate) * 100).toFixed(4).replace(/\.?0+$/, "")}%` : "-"}
              </strong>
            </div>

            <div className="field">
              <span>PARTNERSHIP</span>
              <strong>
                {user?.partnershipType || "SHARING"}
                {user?.partnershipType === "RENTAL" && user?.rentalAmount != null
                  ? ` ₹${user.rentalAmount} / ${user.rentalCycleDays || 30}d`
                  : ""}
              </strong>
            </div>

            <div className="field">
              <span>AUTO SQ %</span>
              <strong>0</strong>
            </div>

            <div className="field">
              <span>USE MARGIN</span>
              <strong>10,56,713</strong>
            </div>

            <div className="button-group">
              <button className="red">RESET PASSWORD</button>

              <button className="green">COMMISSION SHOW</button>

              <button className="green">ACTIVE</button>

              <button className="red">ALERT</button>

              <button className="red">WATCH</button>

              <button className="green">FRESH LIMIT</button>

              <button className="red">OPTIONS SELL</button>

              <button className="green">ONLY SQ</button>

              <button className="green">AUTO SQ</button>

              <button className="green">TRADE</button>

              <button className="red">LEDGER VIEW</button>

              <button className="red">BLOCK SYMBOL</button>
            </div>
          </div>

          {/* CENTER */}

          <div className="panel">
            <h3>User Exchanges</h3>

            <div className="exchange-buttons">
              <button>NSE FUTURE</button>
              <button>NSE OPTIONS</button>
              <button>MCX FUTURE</button>
              <button className="red">MCX OPTIONS</button>
              <button>COMEX</button>
              <button>CRYPTO</button>
              <button className="red">FOREX</button>
              <button>SGX</button>
              <button className="red">US STOCK</button>
              <button>OTHERS</button>
              <button>DGCX</button>
            </div>

            <div className="field">
              <span>MASTER NAME</span>
              <strong>NO-BROKER</strong>
            </div>

            {[
              "SQ-OFF TIME",
              "LIMIT %",
              "PROFIT LIMIT",
              "STANDING LIMIT",
              "MIN RATE",
              "TOTAL MCX LOT",
            ].map((item) => (
              <div className="setting-row" key={item}>
                <label>{item}</label>

                <input placeholder="Enter value" />

                <button>SUBMIT</button>
              </div>
            ))}
          </div>

          {/* RIGHT */}

          <div className="panel">
            <h3>Exchange Settings</h3>

            {["NSE Future", "NSE Options", "MCX Future", "COMEX"].map(
              (exchange) => (
                <div className="exchange-card" key={exchange}>
                  <div className="exchange-header">
                    <span>{exchange}</span>

                    <button className="edit-small">EDIT</button>
                  </div>

                  <div className="exchange-actions">
                    <button>LIMIT</button>
                    <button>MID LIMIT</button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserEditModal;
