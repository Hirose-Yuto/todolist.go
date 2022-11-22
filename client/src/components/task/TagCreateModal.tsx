import React, {useContext, useState} from "react"
import {Button, FormControl, Input, InputLabel, Modal, Stack} from "@mui/material";
import {modalStyle} from "../../Style";
import {TagServiceClient} from "../../proto/TaskServiceClientPb";
import {CreateTagRequest, Tag} from "../../proto/task_pb";
import {SnackBarContext} from "../../App";

type Props = {
    open: boolean,
    onClose: () => void
    appendRows: (t: Tag) => void
}

const TagCreateModal: React.FC<Props> = (props: Props) => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [description, setDescription] = useState("")

    const createTag = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new TagServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new CreateTagRequest()
        req.setDescription(description)
        client.createTag(req, null).then((r: Tag) => {
            setSuccessSnackBar("タグ作成に成功しました")
            console.log(r)

            props.appendRows(r)
            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タグ作成に失敗しました")
            console.log(r)
        })
        setDescription("")
    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <form onSubmit={createTag}>
                <Stack sx={modalStyle} spacing={2}>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="title">タグ名</InputLabel>
                        <Input id="title"
                               onChange={(e) => setDescription(e.target.value)}
                               fullWidth/>
                    </FormControl>
                    <Button type={"submit"}>作成</Button>
                </Stack>
            </form>
        </Modal>)
}

export default TagCreateModal;