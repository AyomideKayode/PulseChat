export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture: {
    url: string;
    publicId: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
}
