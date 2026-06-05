type Props = {
  nickname: string;
  onLogout: () => void;
};

export default function AdminHeader({ nickname, onLogout }: Props) {
  return (
    <div className="adm-header">
      <div className="adm-header__left">
        <h1 className="adm-header__brand">
          <span className="adm-header__brand-accent">PREMIER</span>
          <span className="adm-header__brand-name">HUB</span>
        </h1>
        <p className="adm-header__sub">Panel de administración</p>
      </div>
      <div className="adm-header__right">
        <span className="adm-header__user">{nickname}</span>
        <button onClick={onLogout} className="adm-header__logout">Salir</button>
      </div>
    </div>
  );
}
