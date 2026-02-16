import type { ModalFormData, ModalState } from "../types";

interface ModalProps {
  modal: ModalState;
  modalData: ModalFormData;
  onClose: () => void;
  onSetModalData: React.Dispatch<React.SetStateAction<ModalFormData>>;
  onDoCreate: () => void;
  onDoDelete: () => void;
}

export function Modal({
  modal,
  modalData,
  onClose,
  onSetModalData,
  onDoCreate,
  onDoDelete,
}: ModalProps) {
  if (!modal) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {(modal.action === "create-scene" ||
          modal.action === "create-module") && (
          <>
            <div className="modal-h">
              <span>
                New {modal.action === "create-scene" ? "Scene" : "Module"}
              </span>
              <button className="ib" onClick={onClose}>
                ×
              </button>
            </div>
            <div className="modal-b">
              <div>
                <label>Name</label>
                <input
                  className="pr-v"
                  style={{ width: "100%" }}
                  placeholder={
                    modal.action === "create-scene"
                      ? "e.g. MenuScene"
                      : "e.g. ParticleSystem"
                  }
                  value={modalData.name ?? ""}
                  onChange={(e) =>
                    onSetModalData((d) => ({ ...d, name: e.target.value }))
                  }
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onDoCreate()}
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  className="pr-v"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: 40,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  value={modalData.description ?? ""}
                  onChange={(e) =>
                    onSetModalData((d) => ({
                      ...d,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="modal-f">
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn prim"
                onClick={onDoCreate}
                disabled={!modalData.name?.trim()}
              >
                Create
              </button>
            </div>
          </>
        )}

        {modal.action === "delete" && (
          <>
            <div className="modal-h">
              <span>Delete &quot;{modal.item.name}&quot;?</span>
              <button className="ib" onClick={onClose}>
                ×
              </button>
            </div>
            <div className="modal-b">
              <p style={{ fontSize: 12.5, color: "var(--txt2)" }}>
                This permanently removes the {modal.item.type} and cannot be
                undone.
              </p>
            </div>
            <div className="modal-f">
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
              <button className="btn dng" onClick={onDoDelete}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
