import { useState } from "react";
import classes from "./ForgotPassword.module.css";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const getPassword = async (email: string, nickname: string) => {
    if(email === ""){
      alert("Preencha o campo de email");
      return;
    }
    if(nickname === ""){
      alert("Preencha o campo de nickname");
      return;
    }

    try{
      const response = await axios.get("/Users/getPassword", { params: {
        email: email,
        nickname: nickname
      }})

      setPassword(response.data);
    } catch(error: any) {
      if (error.response) {
        const errorMessage = error.response.data;
        const message = errorMessage.includes("Senha não encontrada")? "Senha não encontrada!" : "Erro ao recuperar senha. Tente novamente mais tarde.";
        alert(message);
      } else if (error.request) {
        alert('No response received from the server.');
      } else {
        alert('Error making the request.');
      }
    }
  }

  return (
    <div className={classes.divCenter}>
      <div className={classes.div}>
        <label>Como esse site foi feito apenas para estudo e prática de desenvolvimento, você pode recuperar sua senha de maneira simples (tendo em vista que os dados usados no registro não precisam ser dados reais).</label>

        <div className={classes.divInput}>
          <label htmlFor="email">Email: </label>
          <input type="text" name="email" placeholder="Digite o email..." onChange={(e) => setEmail(e.target.value)} value={email}/>
        </div>

        <div className={classes.divInput}>
          <label htmlFor="nickname">Nickname: </label>
          <input type="text" name="nickname" placeholder="Digite o nickname..." onChange={(e) => setNickname(e.target.value)} value={nickname}/>
        </div>

        <button className="btnTransparent" onClick={() => getPassword(email, nickname)}>Recuperar senha</button>

        {password !== "" && (
          <div className={classes.divPassword}>
              <p>Sua senha é: <span>{password}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword