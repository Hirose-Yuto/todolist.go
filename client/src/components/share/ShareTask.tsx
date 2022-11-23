import React, {useContext, useEffect, useState} from "react"
import {
    Box, Button, Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Input,
    InputLabel,
    Stack,
    Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import {convertTasks, TsTask} from "../../entity/task";
import {SnackBarContext} from "../../App";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {AssignTaskRequest, TaskList as TaskListAsType} from "../../proto/task_pb";

type Props = {
    setRerender: React.Dispatch<React.SetStateAction<{}>>
}

const ShareTask: React.FC<Props> = (props: Props) => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [allTasks, setAllTasks] = useState<TsTask[]>([])
    const [assignee, setAssignee] = useState("")
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.getAllTasks(new Empty(), null).then((r: TaskListAsType) => {
            console.log(r)
            setAllTasks(convertTasks(r.getTasksList()))
        })
    }, [])

    const handleTaskChange = (id: number) => {
        let newTags = new Set(selectedTaskIds)
        if (newTags.has(id)) {
            newTags.delete(id)
        } else {
            newTags = newTags.add(id)
        }
        setSelectedTaskIds(newTags)
    }

    const shareTask = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new AssignTaskRequest()
        req.setAccountname(assignee)
        req.setTaskIdsList(Array.from(selectedTaskIds))
        client.assignTask(req, null).then(() => {
            props.setRerender({})
            setSuccessSnackBar(`タスクを${assignee}さんと共有しました`)
        }).catch(r => {
            console.log(r)
            if (r.code === 5) {
                setWarningSnackBar(`${assignee}さんが見つかりません`)
            } else {
                setWarningSnackBar(`${assignee}さんとのタスク共有に失敗しました`)
            }

        })
    }


    return (<>
        <Typography variant="h4">タスクを共有する</Typography>
        <Box sx={{border: 1, borderColor: grey[200], boxShadow: 1, my: 1}}>
            <form onSubmit={shareTask}>
                <Stack spacing={2} sx={{p: 2}}>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="name">共有したいユーザーのアカウント名</InputLabel>
                        <Input id="name"
                               onChange={e => setAssignee(e.target.value)}
                               fullWidth/>
                    </FormControl>
                    <FormControl variant="standard">
                        <FormLabel htmlFor="tags">タグ</FormLabel>
                        <FormGroup>
                            {allTasks.map((task: TsTask) => {
                                return <FormControlLabel
                                    key={task.id}
                                    control={<Checkbox name={task.id.toString()}
                                                       value={task.id}
                                                       onClick={() => handleTaskChange(task.id)}
                                    />}
                                    label={task.title}
                                />
                            })}
                        </FormGroup>
                    </FormControl>
                    <Button type={"submit"}>共有</Button>
                </Stack>
            </form>
        </Box>
    </>)
}

export default ShareTask;