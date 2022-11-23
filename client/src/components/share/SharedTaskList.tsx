import React, {useEffect, useState} from "react"
import {DataGrid, GridColDef, GridRenderCellParams, GridRowHeightParams} from "@mui/x-data-grid";
import {TaskServiceClient} from "../../proto/TaskServiceClientPb";
import {SharedTaskList as SharedTaskListAsType} from "../../proto/task_pb"
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {convertSharedTasks, TsSharedTask} from "../../entity/share";
import {TsUser} from "../../entity/user";

type Props = {
    rerender: {}
}

const SharedTaskList: React.FC<Props> = (props: Props) => {

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID', type: 'number'},
        {field: 'title', headerName: 'タスク名', width: 200},
        {field: 'sharing_users', headerName: '共有ユーザ', flex: 1,
            renderCell: (params: GridRenderCellParams<TsUser[]>) => {
            return params.value?.map(u => u.account_name).join(", ") ?? ""
            }
        }
    ]
    const [sharedRows, setSharedRows] = useState<TsSharedTask[]>([])

    useEffect(() => {
        const client = new TaskServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.getSharedTasks(new Empty(), null).then((r: SharedTaskListAsType) => {
            setSharedRows(convertSharedTasks(r.getSharedTaskList()))
        }).catch(r => {
            console.log(r)
        })
    }, [props.rerender])

    return (
        <div style={{height: 500, width: '100%'}}>
            <DataGrid
                rows={sharedRows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[]}
                // getRowHeight={(param: GridRowHeightParams) => numOfTags[param.id as number] > 2 ? 'auto' : 52}
                getEstimatedRowHeight={() => 100}
            />
        </div>
    )
}

export default SharedTaskList;