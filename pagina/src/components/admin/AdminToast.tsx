type Props = {
  msg: string;
  ok: boolean;
};

export default function AdminToast({ msg, ok }: Props) {
  return (
    <div className={`adm-toast${ok ? " adm-toast--ok" : " adm-toast--err"}`}>
      {ok ? "✓ " : "✗ "}{msg}
    </div>
  );
}
