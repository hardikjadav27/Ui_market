import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../store";
import { createUser, getUsers } from "../../store/user/user.reducer";
import UserEditModal from "./UserEditModal";
import { formatSharingRate, getLoggedInRoleId } from "../../utils/roles";
import "./UsersPage.scss";
import "./UserEditModal.scss";

function UsersPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    mobile: "",
    sharing: "0",
    partnershipType: "SHARING",
    rentalAmount: "",
    rentalCycleDays: "30",
  });

  const users = useAppSelector((state) => state.userReducer.users);
  const loggedInRoleId = getLoggedInRoleId();
  const loggedInUserId = localStorage.getItem("userId");

  const getTargetRoleInfo = () => {
    const path = location.pathname;
    if (path.includes("super")) return { roleId: 1, title: "SUPER ADMIN" };
    if (path.includes("admin") && !path.includes("sub-admin"))
      return { roleId: 2, title: "ADMIN" };
    if (path.includes("sub-admin")) return { roleId: 3, title: "SUB ADMIN" };
    if (path.includes("master")) return { roleId: 4, title: "MASTER" };
    if (path.includes("client") || path.includes("user"))
      return { roleId: 5, title: "CLIENT" };
    return { roleId: 5, title: "CLIENT" };
  };

  const { roleId: targetRoleId, title: pageTitle } = getTargetRoleInfo();

  const reload = () => {
    let query = `roleId=${targetRoleId}`;
    if (loggedInUserId && targetRoleId !== 1) {
      if (loggedInRoleId === 1) query += `&superAdminId=${loggedInUserId}`;
      else if (loggedInRoleId === 2) query += `&adminId=${loggedInUserId}`;
      else if (loggedInRoleId === 3) query += `&subAdminId=${loggedInUserId}`;
      else if (loggedInRoleId === 4) query += `&masterId=${loggedInUserId}`;
    }
    dispatch(getUsers(query));
  };

  useEffect(() => {
    reload();
  }, [dispatch, location.pathname, loggedInRoleId, loggedInUserId, targetRoleId]);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }
    if (loggedInRoleId === 1 && form.partnershipType === "RENTAL" && Number(form.rentalAmount || 0) <= 0) {
      toast.error("Rental amount is required for a rental partnership.");
      return;
    }
    try {
      setCreating(true);
      await dispatch(
        createUser({
          roleId: targetRoleId,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          mobile: form.mobile,
          username: form.username,
          sharingRate: targetRoleId === 5 ? undefined : Number(form.sharing || 0),
          ...(loggedInRoleId === 1
            ? {
                partnershipType: form.partnershipType,
                rentalAmount: form.partnershipType === "RENTAL" ? Number(form.rentalAmount || 0) : undefined,
                rentalCycleDays: form.partnershipType === "RENTAL" ? Number(form.rentalCycleDays || 30) : undefined,
              }
            : {}),
        }),
      ).unwrap();
      toast.success("User created.");
      setShowCreate(false);
      setForm({
        fullName: "",
        email: "",
        username: "",
        password: "",
        mobile: "",
        sharing: "0",
        partnershipType: "SHARING",
        rentalAmount: "",
        rentalCycleDays: "30",
      });
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="left-section">
          <button className="summary-btn">SUMMARY {pageTitle}</button>
          <button className="create-btn" onClick={() => setShowCreate(true)}>
            CREATE {pageTitle}
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="record-box">RECORDS : {users?.length || 0}</div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            {targetRoleId >= 2 && <th>SUPER ADMIN</th>}
            {targetRoleId >= 3 && <th>ADMIN</th>}
            {targetRoleId >= 4 && <th>SUB ADMIN</th>}
            {targetRoleId >= 5 && <th>MASTER</th>}
            <th>USERNAME</th>
            {targetRoleId !== 5 && <th>SHARING</th>}
            {loggedInRoleId === 1 && targetRoleId !== 1 && <th>PARTNERSHIP</th>}
            {targetRoleId === 5 && <th>WALLET</th>}
            <th>CREATED DATE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((item: any) => (
            <tr key={item.id}>
              {targetRoleId >= 2 && <td>{item.superAdminName || "-"}</td>}
              {targetRoleId >= 3 && <td>{item.adminName || "-"}</td>}
              {targetRoleId >= 4 && <td>{item.subAdminName || "-"}</td>}
              {targetRoleId >= 5 && <td>{item.masterName || "-"}</td>}
              <td>{item.username}</td>
              {targetRoleId !== 5 && <td>{formatSharingRate(item.sharingRate)}</td>}
              {loggedInRoleId === 1 && targetRoleId !== 1 && (
                <td>
                  {item.partnershipType || "SHARING"}
                  {item.partnershipType === "RENTAL" && item.rentalAmount != null ? ` ₹${item.rentalAmount}` : ""}
                </td>
              )}
              {targetRoleId === 5 && <td>{item.availableBalance ?? 0}</td>}
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(item)}>
                  EDIT
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedUser && (
        <UserEditModal user={selectedUser} onClose={() => setShowModal(false)} />
      )}

      {showCreate && (
        <div className="user-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create {pageTitle}</h3>
            <p>Hierarchy is assigned from your account automatically.</p>
            <div className="field">
              <span>FULL NAME</span>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="field">
              <span>EMAIL</span>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <span>USERNAME</span>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field">
              <span>PASSWORD</span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <span>MOBILE</span>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            {targetRoleId !== 5 && (
              <div className="field">
                <span>SHARING %</span>
                <input value={form.sharing} onChange={(e) => setForm({ ...form, sharing: e.target.value })} />
              </div>
            )}
            {loggedInRoleId === 1 && (
              <>
                <div className="field">
                  <span>PARTNERSHIP</span>
                  <select
                    value={form.partnershipType}
                    onChange={(e) => setForm({ ...form, partnershipType: e.target.value })}
                  >
                    <option value="SHARING">SHARING</option>
                    <option value="RENTAL">RENTAL</option>
                  </select>
                  <small>
                    SHARING: due to parent starts at 0 and rises with each order-turnover commission; child pays
                    cash, parent confirms. RENTAL: monthly fee. Trading wallet is separate prepaid top-up. Global
                    0.01% still applies.
                  </small>
                </div>
                {form.partnershipType === "RENTAL" && (
                  <>
                    <div className="field">
                      <span>RENTAL AMOUNT</span>
                      <input
                        value={form.rentalAmount}
                        onChange={(e) => setForm({ ...form, rentalAmount: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <span>CYCLE DAYS</span>
                      <input
                        value={form.rentalCycleDays}
                        onChange={(e) => setForm({ ...form, rentalCycleDays: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div className="button-group">
              <button type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="button" className="create-btn" onClick={handleCreate} disabled={creating}>
                {creating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
