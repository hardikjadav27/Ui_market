export const createPayload = (
  roleId: number,
  roleName: string,
  formData: {
    fullName: string;
    email: string;
    password: string;
    mobile: string;
    username: string;
  },
) => {
  const loginRole = localStorage.getItem("role");

  const loginId = Number(localStorage.getItem("userId"));

  return {
    superAdminId: loginRole === "SuperAdmin" ? loginId : 0,

    adminId: loginRole === "Admin" ? loginId : 0,

    subAdminId: loginRole === "SubAdmin" ? loginId : 0,

    masterId: loginRole === "Master" ? loginId : 0,

    roleId,
    role: roleName,

    fullName: formData.fullName,
    email: formData.email,
    password: formData.password,
    mobile: formData.mobile,
    username: formData.username,

    ipAddress: "127.0.0.1",

    createdBy: localStorage.getItem("fullName") || "",
  };
};
