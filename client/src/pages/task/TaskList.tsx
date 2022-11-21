import React, {useEffect, useState} from "react"
import {
    Button,
    Container,
    Typography
} from "@mui/material";
import {DataGrid, GridColDef, GridRowParams, GridToolbar} from '@mui/x-data-grid';
import Grid2 from "@mui/material/Unstable_Grid2";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {Task, TaskList as TaskListType} from "../../proto/task_pb"
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import TaskCreateModal from "../../components/task/TaskCreateModal";
import {convertTask, convertTasks, TsTask} from "../../entity/task";
import TaskDetailModal from "../../components/task/TaskDetailModal";
import {useLocation, useParams} from "react-router-dom";

const TaskList = () => {
    const {state} = useLocation()
    const {searchString} = state ?? ""

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID', type: 'number'},
        {field: 'title', headerName: 'タスク名', width: 200},
        {field: 'is_done', headerName: '完了・未完了', width: 120, type: 'boolean'},
        {field: 'priority', headerName: '優先度', type: 'number'},
        {field: 'deadline', headerName: '締め切り', width: 160, type: 'dateTime'},
        {field: 'created_at', headerName: '作成日時', width: 160, type: 'dateTime'},
        {field: 'tags', headerName: "タグ"},
        {field: 'memo', headerName: "メモ"}
    ]

    const [displayRows, setDisplayRows] = useState<TsTask[]>([])
    const [allRows, setAllRows] = useState<TsTask[]>([])
    const appendRows = (t: Task) => {
        setAllRows(rows => [...rows, convertTask(t)])
    }
    const updateTask = (t: TsTask) => {
        setAllRows(allRows.map((e: TsTask) => e.id === t.id ? t : e))
    }
    const removeTask = (id: number) => {
        setAllRows(allRows.filter((t) => t.id !== id))
    }
    useEffect(() => {
        if (searchString) {
            setDisplayRows(allRows.filter((t: TsTask) => t.title.includes(searchString)))
        } else {
            setDisplayRows(allRows)
        }
    }, [allRows, searchString])

    useEffect(() => {
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.getAllTasks(new Empty(), null).then((r: TaskListType) => {
            console.log(r)
            setAllRows(convertTasks(r.getTasksList()))
        })
    }, [])

    const [taskCrateModalOpen, setTaskCrateModalOpen] = useState(false)
    const handleTaskCreateModalOpen = () => {
        setTaskCrateModalOpen(true)
    }
    const handleTaskCreateModalClose = () => {
        setTaskCrateModalOpen(false)
    }

    const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false)
    const handleTaskDetailModalOpen = () => {
        setTaskDetailModalOpen(true)
    }
    const handleTaskDetailModalClose = () => {
        setTaskDetailModalOpen(false)
    }
    const [selectedTask, setSelectedTask] = useState<TsTask>()
    const onRowClick = (e: GridRowParams<TsTask>) => {
        setSelectedTask(e.row)
        handleTaskDetailModalOpen()
        console.log(e.row)
    }

    return (
        <Container sx={{py: 5}}>
            <Grid2 container spacing={2} sx={{margin: 1}} alignItems="center">
                <Grid2 xs={10}>
                    <Grid2 container alignItems="center">
                        <Grid2>
                            <Typography variant="h4" align="left">タスク一覧</Typography>
                        </Grid2>
                        {searchString &&
                            <Grid2>
                                <Typography>
                                    "{searchString}"の検索結果
                                </Typography>
                            </Grid2>
                        }
                    </Grid2>
                </Grid2>
                <Grid2 xs={2}>
                    <Button onClick={handleTaskCreateModalOpen}>タスク作成</Button>
                </Grid2>
            </Grid2>
            <div style={{height: 500, width: '100%'}}>
                <DataGrid
                    rows={displayRows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[]}
                    onRowClick={onRowClick}
                />
            </div>
            <TaskCreateModal open={taskCrateModalOpen} onClose={handleTaskCreateModalClose} appendRows={appendRows}/>
            <TaskDetailModal open={taskDetailModalOpen}
                             onClose={handleTaskDetailModalClose}
                             task={selectedTask}
                             updateTask={updateTask}
                             removeTask={removeTask}
            />
        </Container>)
}

export default TaskList;