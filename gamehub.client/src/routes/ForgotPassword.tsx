import { Link } from 'react-router-dom';
import classes from './ForgotPassword.module.css';

const ForgotPassword = () => (
  <div className={classes.divCenter}>
    <div className={classes.div}>
      <h2>Recuperação de senha indisponível</h2>
      <p>
        Por segurança, o GameHub nunca mostra senhas. As contas antigas foram
        bloqueadas porque utilizavam o formato anterior de armazenamento.
      </p>
      <p>Enquanto a recuperação por email não estiver pronta, crie uma nova conta.</p>
      <Link to="/register" className="btnTransparent">Criar nova conta</Link>
      <Link to="/" className="link">Voltar ao login</Link>
    </div>
  </div>
);

export default ForgotPassword;
