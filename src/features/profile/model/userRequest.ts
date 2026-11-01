export interface UpdateUserBody {
  email: string;
  nickname: string;
  name: string;
  birthDate: string;
  introduction?: string;
  profilePicture?: string;
}

export interface UpdateNicknameBody {
  nickname: string;
}

export interface UpdatePasswordBody {
  password: string;
}

export interface UpdatePictureBody {
  profilePicture: string;
}
