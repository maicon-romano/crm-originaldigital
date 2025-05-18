// Rotas para adicionar ao arquivo routes.ts

// Rota para teste de conexão com o servidor de email
app.get("/api/email/test-connection", async (req, res) => {
  try {
    const result = await verifyEmailConnection();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    console.error("Erro ao testar conexão com servidor de email:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao testar conexão com servidor de email",
      error: error.message 
    });
  }
});

// Rota para envio de convites por email
app.post("/api/email/send-invitation", async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false,
        message: "Dados incompletos. Forneça email e nome do destinatário."
      });
    }
    
    console.log("Enviando convite por email para:", email);
    
    // Enviar o email de convite
    const result = await sendInvitationEmail({
      to: email,
      name: name,
      password: password || "Senha123!",
      role: role || "Usuário"
    });
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: result.message 
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error: any) {
    console.error("Erro ao enviar convite por email:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao enviar convite por email",
      error: error.message 
    });
  }
});