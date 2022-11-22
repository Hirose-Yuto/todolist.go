import {Tag, Task} from "../proto/task_pb";

export type TsTask = {
    id: number,
    title: string,
    memo: string,
    is_done: boolean,
    priority: number,
    deadline: Date | undefined,
    created_at: Date | undefined,
    tags: TsTag[]
}

export type TsTag = {
    id: number,
    description: string
}

export const convertTasks = (ts: Task[]): TsTask[] => {
    const tasks: TsTask[] = []
    ts.forEach((t: Task) => {
        tasks.push(convertTask(t))
    })
    return tasks
}

export const convertTask = (t: Task): TsTask => {
    return {
        id: t.getId(),
        title: t.getTitle(),
        memo: t.getMemo(),
        is_done: t.getIsDone(),
        priority: t.getPriority(),
        deadline: t.getDeadline()?.toDate(),
        created_at: t.getCratedAt()?.toDate(),
        tags: convertTags(t.getTagsList())
    }
}

export const convertTag = (t: Tag): TsTag => {
    return {
        id: t.getId(),
        description: t.getDescription()
    }
}

export const convertTags = (t: Tag[]): TsTag[] => {
    const tags: TsTag[] = []
    t.forEach((t: Tag) => {
        tags.push(convertTag(t))
    })
    return tags
}