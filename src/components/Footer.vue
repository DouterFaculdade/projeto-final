<script setup></script>

<template>
 <footer class="main-footer">
    <div class="footer-content">
      <div class="footer-brand">HeNC &copy; 2025</div>
      <div class="footer-links">
        <a href="mailto:fe.gerei@hotmail.com">Contato</a>
        <a href="https://github.com/DouterFaculdade/projeto-final" target="_blank">GitHub</a>
      </div>
      <div class="footer-credit">Desenvolvido por Felipe</div>
    </div>
 </footer>
</template>

<style scoped>
.main-footer {
  width: 100%;
  background: #fff;
  border-top: 1.5px solid #ffe3e3;
  box-shadow: 0 -2px 8px rgba(255,77,51,0.04);
  padding: 24px 0 12px 0;
  margin-top: auto;
}
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.footer-brand {
  font-size: 1.1em;
  font-weight: bold;
  color: #FF4D33;
}
.footer-links {
  display: flex;
  gap: 18px;
}
.footer-links a {
  color: #333;
  text-decoration: none;
  font-size: 1em;
  transition: color 0.15s;
}
.footer-links a:hover {
  color: #FF4D33;
}
.footer-credit {
  font-size: 0.95em;
  color: #888;
}
</style>
