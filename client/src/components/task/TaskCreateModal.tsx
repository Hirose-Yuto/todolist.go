import React, {useContext, useState} from "react"
import {Button, FormControl, FormHelperText, Input, InputLabel, Modal, Stack, Typography} from "@mui/material";
import {modalStyle} from "../../Style";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {CreateTaskRequest, Task} from "../../proto/task_pb";
import {Timestamp} from "google-protobuf/google/protobuf/timestamp_pb";
import {SnackBarContext} from "../../App";

type Props = {
    open: boolean,
    onClose: () => void
    appendRows: (t: Task) => void
}

const TaskCreateModal: React.FC<Props> = (props: Props) => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [title, setTitle] = useState("")
    const [memo, setMemo] = useState("")
    const [priority, setPriority] = useState(5)
    const [deadline, setDeadline] = useState<Date | null>(null)

    const createTask = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new CreateTaskRequest()
        req.setTitle(title)
        req.setMemo(memo)
        req.setPriority(priority)
        req.setIsDone(false)
        req.setDeadline(deadline ? Timestamp.fromDate(deadline) : undefined)
        client.createTask(req, null).then((r: Task) => {
            setSuccessSnackBar("タスク作成に成功しました")
            console.log(r)

            props.appendRows(r)
            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タスク作成に失敗しました")
            console.log(r)
        })
        setTitle("")
        setMemo("")
        setPriority(5)
        setDeadline(null)
    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <form onSubmit={createTask}>
                <Stack sx={modalStyle} spacing={2}>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="title">タスク名</InputLabel>
                        <Input id="title"
                               onChange={(e) => setTitle(e.target.value)}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="memo">メモ</InputLabel>
                        <Input id="memo"
                               onChange={(e) => setMemo(e.target.value)}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="priority">優先度</InputLabel>
                        <Input id="priority"
                               onChange={(e) => setPriority(parseInt(e.target.value))}
                               type="number"
                               defaultValue={5}
                               fullWidth/>
                        <FormHelperText>最小値は0で、大きくなるほど優先度は高くなります (デフォルト値: 5)</FormHelperText>
                        {priority < 0 && <FormHelperText error>非負の値を入力してください</FormHelperText>}
                    </FormControl>
                    <FormControl>
                        <Typography>締め切り (オプション)</Typography>
                        <Input id="priority"
                               onChange={(e) => setDeadline(new Date(e.target.value))}
                               type="datetime-local"
                               fullWidth/>
                    </FormControl>
                    <Button type={"submit"}>作成</Button>
                </Stack>
            </form>
        </Modal>)
}

export default TaskCreateModal;