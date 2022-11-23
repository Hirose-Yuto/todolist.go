import React, {useEffect, useState} from "react"
import {
    Box,
    Button,
    Container, Stack,
    Typography
} from "@mui/material";
import {DataGrid, GridColDef, GridRenderCellParams, GridRowHeightParams, GridRowParams} from '@mui/x-data-grid';
import Grid2 from "@mui/material/Unstable_Grid2";
import {TagServiceClient, TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {TagList as TagListAsType, Task, TaskList as TaskListAsType} from "../../proto/task_pb"
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import TaskCreateModal from "../../components/task/TaskCreateModal";
import {convertTags, convertTask, convertTasks, TsTag, TsTask} from "../../entity/task";
import TaskDetailModal from "../../components/task/TaskDetailModal";
import {useLocation} from "react-router-dom";
import {grey} from "@mui/material/colors";

const TaskList = () => {
    const {state} = useLocation()
    const {searchString} = state ?? ""

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID', type: 'number'},
        {field: 'title', headerName: 'タスク名', width: 200},
        {field: 'is_done', headerName: '完了・未完了', width: 120, type: 'boolean'},
        {field: 'priority', headerName: '優先度', type: 'number'},
        {
            field: 'deadline', headerName: '締め切り', width: 160, type: 'dateTime',
            renderCell: (params: GridRenderCellParams<Date>) => {
                return params.value?.getTime() !== 0 ? params.value?.toLocaleString() : ""
            }
        },
        {field: 'created_at', headerName: '作成日時', width: 160, type: 'dateTime'},
        {
            field: 'tags', headerName: "タグ", width: 160,
            renderCell: (params: GridRenderCellParams<TsTag[]>) =>
                <Stack alignItems={"center"} flex={1}>
                    {
                        params.value?.map((t: TsTag, index: number) =>
                            <Box key={index}
                                 sx={{border: 1, borderColor: grey[200], boxShadow: 1, width: "100%"}}
                            >
                                {t.description}
                            </Box>)
                    }
                </Stack>
        },
        {field: 'memo', headerName: "メモ"}
    ]

    const [displayRows, setDisplayRows] = useState<TsTask[]>([])
    const [allRows, setAllRows] = useState<TsTask[]>([])
    type numOfTagsType = { [index: number]: number }
    const [numOfTags, setNumOfTags] = useState<numOfTagsType>({})
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
        const taskClient = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        taskClient.getAllTasks(new Empty(), null).then((r: TaskListAsType) => {
            console.log(r)
            setAllRows(convertTasks(r.getTasksList()))
            const n: numOfTagsType = {}
            r.getTasksList().forEach(t => n[t.getId()] = t.getTagsList().length)
            setNumOfTags(n)
        })
        const tagClient = new TagServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        tagClient.getAllTags(new Empty(), null).then((r: TagListAsType) => {
            console.log(r)
            setAllTags(convertTags(r.getTagsList()))
        })
    }, [])
    const [allTags, setAllTags] = useState<TsTag[]>([])

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
                    getRowHeight={(param: GridRowHeightParams) => numOfTags[param.id as number] > 2 ? 'auto' : 52}
                    getEstimatedRowHeight={() => 100}
                />
            </div>
            <TaskCreateModal open={taskCrateModalOpen}
                             onClose={handleTaskCreateModalClose}
                             appendRows={appendRows}
                             tags={allTags}
            />
            <TaskDetailModal open={taskDetailModalOpen}
                             onClose={handleTaskDetailModalClose}
                             task={selectedTask}
                             updateTask={updateTask}
                             removeTask={removeTask}
                             tags={allTags}
            />
        </Container>)
}

export default TaskList;