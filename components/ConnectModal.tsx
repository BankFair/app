import { Modal } from './Modal'
import { Connect } from './Connect'

export function ConnectModal({ onClose }: { onClose?(): void }) {
    return (
        <Modal onClose={onClose}>
            <Connect />
        </Modal>
    )
}
