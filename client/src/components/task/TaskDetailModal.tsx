import React, {useEffect, useState} from "react"
import {
    Button,
    FormControl,
    FormHelperText,
    Input,
    InputLabel,
    MenuItem,
    Modal, Select,
    Stack,
    Typography
} from "@mui/material";
import {modalStyle} from "../../Style";
import {DeleteTaskRequest, Task, UpdateTaskRequest} from "../../proto/task_pb";
import {TsTask} from "../../entity/task";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {Timestamp} from "google-protobuf/google/protobuf/timestamp_pb";
import Grid2 from "@mui/material/Unstable_Grid2";

type Props = {
    open: boolean,
    onClose: () => void,
    task: TsTask | undefined,
    updateTask: (t: TsTask) => void,
    removeTask: (id: number) => void
}

const TaskDetailModal: React.FC<Props> = (props: Props) => {
    const [title, setTitle] = useState("")
    const [memo, setMemo] = useState("")
    const [isDone, setIsDone] = useState(false)
    const [priority, setPriority] = useState(5)
    const [deadline, setDeadline] = useState<Date>(new Date())

    useEffect(() => {
        setTitle(props.task?.title ?? "")
        setMemo(props.task?.memo ?? "")
        setIsDone(props.task?.is_done ?? false)
        setPriority(props.task?.priority ?? 5)
        setDeadline(props.task?.deadline ?? new Date())
    }, [props.task])

    const updateTask = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new UpdateTaskRequest()
        req.setTaskId(props.task?.id ?? 0)
        req.setTitle(title)
        req.setMemo(memo)
        req.setPriority(priority)
        req.setIsDone(isDone)
        req.setDeadline(deadline ? Timestamp.fromDate(deadline) : undefined)
        client.updateTask(req, null).then(() => {
            console.log("task updated")
            props.updateTask({
                id: props.task?.id ?? 0,
                title: title,
                memo: memo,
                priority: priority,
                is_done: isDone,
                deadline: deadline,
                created_at: props.task?.created_at ?? new Date(),
                tags: props.task?.tags ?? []
            })
            props.onClose()
        }).catch(r => {
            console.log(r)
            props.onClose()
        })
    }

    const deleteTask = () => {
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new DeleteTaskRequest()
        req.setTaskId(props.task?.id ?? 0)
        client.deleteTask(req, null).then(() => {
            console.log("task deleted")
            props.removeTask(props.task?.id ?? 0)
            props.onClose()
        }).catch(r => {
            console.log(r)
            props.onClose()
        })
    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <form onSubmit={updateTask}>
                <Stack sx={modalStyle} spacing={2}>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="title">タスク名</InputLabel>
                        <Input id="title"
                               onChange={(e) => setTitle(e.target.value)}
                               value={title}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="memo">メモ</InputLabel>
                        <Input id="memo"
                               onChange={(e) => setMemo(e.target.value)}
                               value={memo}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="is_done">完了・未完了</InputLabel>
                        <Select id="is_done"
                                onChange={(e) => setIsDone(e.target.value === "0")}
                                value={isDone ? "0" : "1"}
                                fullWidth>
                            <MenuItem value={"0"}>完了</MenuItem>
                            <MenuItem value={"1"}>未完了</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="priority">優先度</InputLabel>
                        <Input id="priority"
                               onChange={(e) => setPriority(parseInt(e.target.value))}
                               type="number"
                               value={priority}
                               fullWidth/>
                        <FormHelperText>最小値は0で、大きくなるほど優先度は高くなります (デフォルト値: 5)</FormHelperText>
                        {priority < 0 && <FormHelperText error>非負の値を入力してください</FormHelperText>}
                    </FormControl>
                    <FormControl>
                        <Typography>締め切り (オプション)</Typography>
                        <Input id="priority"
                               onChange={(e) => setDeadline(new Date(e.target.value))}
                               type="datetime-local"
                               value={deadline}
                               fullWidth/>
                    </FormControl>
                    <Grid2 container justifyItems={"center"}>
                        <Grid2>
                            <Button type={"submit"}>更新</Button>
                        </Grid2>
                        <Grid2>
                            <Button onClick={deleteTask} color={"warning"}>削除</Button>
                        </Grid2>
                    </Grid2>
                </Stack>
            </form>
        </Modal>
    )
}

export default TaskDetailModal;