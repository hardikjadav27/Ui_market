// import { NavLink } from "react-router-dom";

// function Header() {
//   const role = localStorage.getItem("role");
//   const fullName = localStorage.getItem("fullName");

//   return (
//     <header className="top-header">
//       <div className="logo">DPASA</div>

//       <nav className="menu-bar">
//         <NavLink to="/dashboard/home">Home</NavLink>

//         <NavLink to="/dashboard/watchlist">Watchlist</NavLink>

//         {role === "SuperAdmin" && (
//           <NavLink to="/dashboard/super">Super</NavLink>
//         )}

//         {(role === "SuperAdmin" || role === "Admin") && (
//           <NavLink to="/dashboard/master">Master</NavLink>
//         )}

//         {(role === "SuperAdmin" || role === "Admin" || role === "Master") && (
//           <NavLink to="/dashboard/user">User</NavLink>
//         )}

//         <NavLink to="/dashboard/standing">Standing</NavLink>

//         <NavLink to="/dashboard/trade">Trade</NavLink>

//         <NavLink to="/dashboard/pending">Pending</NavLink>

//         <NavLink to="/dashboard/holding">Holding</NavLink>

//         <NavLink to="/dashboard/wallet">Wallet</NavLink>
//       </nav>

//       <div className="profile-section">
//         <span className="role-name">{role}</span> : {fullName}
//       </div>
//     </header>
//   );
// }

// export default Header;

import { NavLink } from "react-router-dom";
import { getLoggedInRoleId } from "../utils/roles";
import "./header.scss";

function Header() {
  const role = localStorage.getItem("role");
  const fullName = localStorage.getItem("fullName");
  const roleId = getLoggedInRoleId();

  // const isSuperAdmin = roleId === 1;
  // const isAdmin = roleId === 2;
  // const isSubAdmin = roleId === 3;
  // const isMaster = roleId === 4;
  const isClient = roleId === 5;

  return (
    <header className="top-header">
      {/* ========================= */}
      {/* LOGO */}
      {/* ========================= */}

      <div className="logo">DPASA</div>

      {/* ========================= */}
      {/* NAVIGATION */}
      {/* ========================= */}

      <nav className="menu-bar">
        {/* ========================= */}
        {/* COMMON MENUS */}
        {/* ========================= */}

        <NavLink to="/dashboard/home">Home</NavLink>

        <NavLink to="/dashboard/watchlist">Watchlist</NavLink>

        {/* ========================= */}
        {/* SUPER ADMIN */}
        {/* ========================= */}

        {/* {isSuperAdmin && <NavLink to="/dashboard/super">Super Admin</NavLink>} */}

        {/* ========================= */}
        {/* ADMIN */}
        {/* Only SuperAdmin can manage Admin */}
        {/* ========================= */}

        {/* {isSuperAdmin && <NavLink to="/dashboard/admin">Admin</NavLink>} */}

        {/* ========================= */}
        {/* SUB ADMIN */}
        {/* SuperAdmin and Admin */}
        {/* ========================= */}

        {/* {(isSuperAdmin || isAdmin) && (
          <NavLink to="/dashboard/sub-admin">Sub Admin</NavLink>
        )} */}

        {/* ========================= */}
        {/* MASTER */}
        {/* SuperAdmin, Admin, SubAdmin */}
        {/* ========================= */}

        {/* {(isSuperAdmin || isAdmin || isSubAdmin) && (
          <NavLink to="/dashboard/master">Master</NavLink>
        )} */}

        {/* ========================= */}
        {/* CLIENT MANAGEMENT */}
        {/* ========================= */}
        {/* Client role itself will NOT see this menu */}

        {/* {(isSuperAdmin || isAdmin || isSubAdmin || isMaster) && (
          <NavLink to="/dashboard/client">Client</NavLink>
        )} */}

        {/* ========================= */}
        {/* TRADING MENUS */}
        {/* ========================= */}

        <NavLink to="/dashboard/pending">Order Book</NavLink>

        <NavLink to="/dashboard/standing">Position Book</NavLink>

        <NavLink to="/dashboard/holding">Holding</NavLink>

        <NavLink to="/dashboard/wallet">Wallet</NavLink>

        {!isClient && <NavLink to="/dashboard/revenue">Revenue</NavLink>}
      </nav>

      {/* ========================= */}
      {/* PROFILE */}
      {/* ========================= */}

      <div className="profile-section">
        <span className="role-name">{role}</span>

        <span>: {fullName}</span>
      </div>
    </header>
  );
}

export default Header;
