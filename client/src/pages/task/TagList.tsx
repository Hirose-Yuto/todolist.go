import React, {useEffect, useState} from "react"
import {DataGrid, GridColDef, GridRowParams} from "@mui/x-data-grid";
import {convertTag, convertTags, TsTag} from "../../entity/task";
import {Tag, TagList as TagListAsType} from "../../proto/task_pb";
import {TagServiceClient} from "../../proto/TaskServiceClientPb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {Button, Container, Typography} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import TagCreateModal from "../../components/task/TagCreateModal";
import TagDetailModal from "../../components/task/TagDetailModal";

const TagList = () => {
    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID', type: 'number'},
        {field: 'description', headerName: 'タグ名', width: 200},
    ]

    const [allRows, setAllRows] = useState<TsTag[]>([])
    const appendRows = (t: Tag) => {
        setAllRows(rows => [...rows, convertTag(t)])
    }
    const updateTag = (t: TsTag) => {
        setAllRows(allRows.map((e: TsTag) => e.id === t.id ? t : e))
    }
    const removeTag = (id: number) => {
        setAllRows(allRows.filter((t) => t.id !== id))
    }

    useEffect(() => {
        const client = new TagServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.getAllTags(new Empty(), null).then((r: TagListAsType) => {
            console.log(r)
            setAllRows(convertTags(r.getTagsList()))
        })
    }, [])

    const [tagCrateModalOpen, setTagCrateModalOpen] = useState(false)
    const handleTagCreateModalOpen = () => setTagCrateModalOpen(true)
    const handleTagCreateModalClose = () => setTagCrateModalOpen(false)

    const [tagDetailModalOpen, setTagDetailModalOpen] = useState(false)
    const handleTagDetailModalOpen = () => setTagDetailModalOpen(true)
    const handleTagDetailModalClose = () => setTagDetailModalOpen(false)

    const [selectedTag, setSelectedTag] = useState<TsTag>()
    const onRowClick = (e: GridRowParams<TsTag>) => {
        setSelectedTag(e.row)
        handleTagDetailModalOpen()
        console.log(e.row)
    }

    return (
        <Container sx={{py: 5}}>
            <Grid2 container spacing={2} sx={{margin: 1}} alignItems="center">
                <Grid2 xs={10}>
                    <Grid2 container alignItems="center">
                        <Grid2>
                            <Typography variant="h4" align="left">タグ一覧</Typography>
                        </Grid2>
                    </Grid2>
                </Grid2>
                <Grid2 xs={2}>
                    <Button onClick={handleTagCreateModalOpen}>タグ作成</Button>
                </Grid2>
            </Grid2>
            <div style={{height: 500, width: '100%'}}>
                <DataGrid
                    rows={allRows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[]}
                    onRowClick={onRowClick}
                />
            </div>
            <TagCreateModal open={tagCrateModalOpen} onClose={handleTagCreateModalClose} appendRows={appendRows}/>
            <TagDetailModal open={tagDetailModalOpen}
                            onClose={handleTagDetailModalClose}
                            tag={selectedTag}
                            updateTag={updateTag}
                            removeTag={removeTag}
            />
        </Container>)
}

export default TagList;