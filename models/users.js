import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        unique: false,
    },
    lastname: {
        type: String,
        required: true,
        unique: false,
    },
    dateOfBirth: {
        type: Date,
        required: false,
        unique: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: (val) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(val),
            message: ({ value }) => `${value} is not a valid email adress.`,
        },
    },
    emailVerifiedAt: {
        type: Date,
        required: true,
        default: false,
    },
    password: {
        type: String,
        required: true,
        select: false, // don't return password to frontend
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    avatarUrl: {
        type: String,
        required: false,
    },
    token: String,
});

const User = mongoose.model("users", userSchema);

export default User;
