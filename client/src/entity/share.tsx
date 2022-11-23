import {SharedTask} from "../proto/task_pb";
import {convertUsers, TsUser} from "./user";

export type TsSharedTask = {
    id: number
    title: string
    sharing_users: TsUser[]
}

export const convertSharedTasks = (sts: SharedTask[]): TsSharedTask[] => {
    const tasks: TsSharedTask[] = []
    sts.forEach((t: SharedTask) => {
        tasks.push(convertSharedTask(t))
    })
    return tasks
}

export const convertSharedTask = (st: SharedTask): TsSharedTask => {
    return {
        id: st.getTaskId(),
        title: st.getTitle(),
        sharing_users: convertUsers(st.getSharingUsersList())
    }
}