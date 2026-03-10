// src/components/Print.jsx
import GestureButton from './GestureButton/GestureButton';

export default function Print({ generatedImage }) {
  
  const handlePrint = () => {
    if (!generatedImage) return;
    
    // 画像のサイズを取得して向きを判定する
    const img = new Image();
    img.src = generatedImage;
    img.onload = () => {
      const isLandscape = img.width > img.height;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="ja">
            <head>
              <meta charset="UTF-8">
              <title>Kimono Mirror Print</title>
              <style>
                /* 🌟 向きを用紙に合わせて最適化 */
                @page {
                  margin: 0;
                  size: ${isLandscape ? 'landscape' : 'portrait'};
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 100vw;
                  height: 100vh;
                  background-color: #fff;
                }
                img {
                  /* 🌟 用紙の長い方に合わせて最大化 */
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  display: block;
                }
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <img src="${generatedImage}" />
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        alert("印刷ウィンドウが開けませんでした。ブラウザの設定でポップアップを許可してください。");
      }
    };
  };

  return (
    <GestureButton variant="panel" onClick={handlePrint}>
      <span style={{ fontSize: '24px' }}>🖨️</span>
      <span>印刷する</span>
    </GestureButton>
  );
}
