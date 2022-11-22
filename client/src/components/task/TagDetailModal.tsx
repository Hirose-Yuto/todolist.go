import React, {useContext, useEffect, useState} from "react"
import {
    Button,
    FormControl,
    Input,
    InputLabel,
    Modal,
    Stack,
} from "@mui/material";
import {modalStyle} from "../../Style";
import {DeleteTagRequest, UpdateTagRequest} from "../../proto/task_pb";
import {TsTag} from "../../entity/task";
import {TagServiceClient} from "../../proto/TaskServiceClientPb";
import Grid2 from "@mui/material/Unstable_Grid2";
import {SnackBarContext} from "../../App";

type Props = {
    open: boolean,
    onClose: () => void,
    tag: TsTag | undefined,
    updateTag: (t: TsTag) => void,
    removeTag: (id: number) => void
}

const TagDetailModal: React.FC<Props> = (props: Props) => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [description, setDescription] = useState("")

    useEffect(() => {
        setDescription(props.tag?.description ?? "")
    }, [props.tag])

    const updateTag = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new TagServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new UpdateTagRequest()
        req.setTagId(props.tag?.id ?? 0)
        req.setDescription(description ?? "")
        client.updateTag(req, null).then(() => {
            props.updateTag({
                id: props.tag?.id ?? 0,
                description: props.tag?.description ?? ""
            })
            setSuccessSnackBar("タグの更新に成功しました")
            console.log("tag updated")

            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タグの更新に失敗しました")
            console.log(r)
        })
    }

    const deleteTag = () => {
        const client = new TagServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new DeleteTagRequest()
        req.setTagId(props.tag?.id ?? 0)
        client.deleteTag(req, null).then(() => {
            setSuccessSnackBar("タスクの削除に成功しました")
            console.log("tag deleted")
            props.removeTag(props.tag?.id ?? 0)
            props.onClose()
        }).catch(r => {
            setWarningSnackBar("タスクの削除に失敗しました")
            console.log(r)
        })
    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <form onSubmit={updateTag}>
                <Stack sx={modalStyle} spacing={2}>
                    <FormControl variant="standard" required>
                        <InputLabel htmlFor="title">タグ名</InputLabel>
                        <Input id="title"
                               onChange={(e) => setDescription(e.target.value)}
                               value={description}
                               fullWidth/>
                    </FormControl>
                    <Grid2 container justifyItems={"center"}>
                        <Grid2>
                            <Button type={"submit"}>更新</Button>
                        </Grid2>
                        <Grid2>
                            <Button onClick={deleteTag} color={"warning"}>削除</Button>
                        </Grid2>
                    </Grid2>
                </Stack>
            </form>
        </Modal>
    )
}

export default TagDetailModal;