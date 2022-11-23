import {UserInfo} from "../proto/user_pb";

export type TsUser = {
    id: number
    account_name: string
}

export const convertUser = (u: UserInfo): TsUser => {
    return {
        id: u.getUserId(),
        account_name: u.getAccountName()
    }
}

export const convertUsers = (us: UserInfo[]): TsUser[] => {
    const users: TsUser[] = []
    us.forEach((u: UserInfo) => {
        users.push(convertUser(u))
    })
    return users
}