import React, {useContext, useEffect, useState} from "react"
import {
    Button, Checkbox,
    FormControl, FormControlLabel, FormGroup,
    FormHelperText, FormLabel,
    Input,
    InputLabel,
    MenuItem,
    Modal, Select,
    Stack,
    Typography
} from "@mui/material";
import {modalStyle} from "../../Style";
import {DeleteTaskRequest, UpdateTaskRequest} from "../../proto/task_pb";
import {TsTag, TsTask} from "../../entity/task";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {Timestamp} from "google-protobuf/google/protobuf/timestamp_pb";
import Grid2 from "@mui/material/Unstable_Grid2";
import {SnackBarContext} from "../../App";

type Props = {
    open: boolean,
    onClose: () => void,
    task: TsTask | undefined,
    setRerenderTask: React.Dispatch<React.SetStateAction<{}>>,
    tags: TsTag[]
}

const TaskDetailModal : React.FC<Props> = (props: Props) => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [title, setTitle] = useState("")
    const [memo, setMemo] = useState("")
    const [isDone, setIsDone] = useState(false)
    const [priority, setPriority] = useState(5)
    const [deadline, setDeadline] = useState<Date>(new Date())
    const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        setTitle(props.task?.title ?? "")
        setMemo(props.task?.memo ?? "")
        setIsDone(props.task?.is_done ?? false)
        setPriority(props.task?.priority ?? 5)
        setDeadline(props.task?.deadline ?? new Date())
        setSelectedTagIds(new Set(props.task?.tags.map(t => t.id) ?? []))
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
        req.setTagIdsList(Array.from(selectedTagIds))
        client.updateTask(req, null).then(() => {
            props.setRerenderTask({})
            setSuccessSnackBar("タスクの更新に成功しました")
            console.log("task updated")
            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タスクの更新に失敗しました")
            console.log(r)
        })
    }

    const deleteTask = () => {
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new DeleteTaskRequest()
        req.setTaskId(props.task?.id ?? 0)
        client.deleteTask(req, null).then(() => {
            setSuccessSnackBar("タスクの削除に成功しました")
            console.log("task deleted")
            props.setRerenderTask({})
            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タスクの削除に失敗しました")
            console.log(r)
        })
    }

    const handleTagChange = (id: number) => {
        let newTags = new Set(selectedTagIds)
        if (newTags.has(id)) {
            newTags.delete(id)
        } else {
            newTags = newTags.add(id)
        }
        setSelectedTagIds(newTags)
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
                               value={deadline.getTime() !== 0 ? deadline.toISOString().slice(0, 19) : ""}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard">
                        <FormLabel htmlFor="tags">タグ</FormLabel>
                        <FormGroup>
                            {props.tags.map((tag: TsTag) => {
                                return <FormControlLabel
                                    key={tag.id}
                                    control={<Checkbox name={tag.id.toString()}
                                                       value={tag.id}
                                                       onClick={() => handleTagChange(tag.id)}
                                                       checked={selectedTagIds.has(tag.id)}
                                    />}
                                    label={tag.description}
                                />
                            })}
                        </FormGroup>
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