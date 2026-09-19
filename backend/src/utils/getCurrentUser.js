import User from "../models/User.js";
import UserClient from "../models/UserClient.js";

export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    if (user.role === "super_admin") {
        return {
            userId: user._id,
            role: user.role,
            clientRole: null,
            clientId: null,
            client: null,
        };
    }

    const membershipQuery = {
        userId,
        status: "active",
        roleInClient: user.role,
    };

    const membership = await UserClient
        .findOne(membershipQuery)
        .populate("clientId");

    if (!membership) {
        return null;
    }

    return {
        userId: user._id,
        role: user.role,
        clientRole: membership.roleInClient,
        clientId: membership.clientId._id,
        client: membership.clientId,
    };
};