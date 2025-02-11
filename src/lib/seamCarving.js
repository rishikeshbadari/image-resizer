export const isSkinPixel = (r, g, b) => {
    const sum = r + g + b;
    if (sum === 0) return false;
    
    const rNorm = r / sum;
    const gNorm = g / sum;
    
    return (
      r > 95 && g > 40 && b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 && 
      r > g && r > b &&
      rNorm > 0.35 && 
      gNorm > 0.27 && 
      gNorm < 0.37
    );
  };
  
  export const computeEnergyMap = async (imageData) => {
    const { width, height, data } = imageData;
    const energyMap = new Array(height).fill(0).map(() => new Array(width).fill(0));
  
    // First compute basic energy map
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let energy = 0;
        
        // For each color channel (R,G,B)
        for (let c = 0; c < 3; c++) {
          const left = x > 0 ? data[((y * width + (x - 1)) * 4) + c] : data[((y * width + x) * 4) + c];
          const right = x < width - 1 ? data[((y * width + (x + 1)) * 4) + c] : data[((y * width + x) * 4) + c];
          const up = y > 0 ? data[(((y - 1) * width + x) * 4) + c] : data[((y * width + x) * 4) + c];
          const down = y < height - 1 ? data[(((y + 1) * width + x) * 4) + c] : data[((y * width + x) * 4) + c];
  
          const dx = right - left;
          const dy = down - up;
          energy += dx * dx + dy * dy;
        }
  
        energyMap[y][x] = Math.sqrt(energy);
      }
    }
  
    // Apply skin detection
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        if (isSkinPixel(r, g, b)) {
          // Increase energy for skin pixels and surrounding area
          for (let dy = -5; dy <= 5; dy++) {
            for (let dx = -5; dx <= 5; dx++) {
              const newY = y + dy;
              const newX = x + dx;
              if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                energyMap[newY][newX] = Math.max(energyMap[newY][newX], 1000000);
              }
            }
          }
        }
      }
    }
  
    return energyMap;
  };
  
  export const findSeam = (energyMap, direction = 'vertical') => {
    const height = energyMap.length;
    const width = energyMap[0].length;
    const isVertical = direction === 'vertical';
    const dp = Array(height).fill().map(() => Array(width).fill(Infinity));
    const backtrack = Array(height).fill().map(() => Array(width).fill(0));
  
    // Initialize first row/column
    if (isVertical) {
      for (let x = 0; x < width; x++) dp[0][x] = energyMap[0][x];
    } else {
      for (let y = 0; y < height; y++) dp[y][0] = energyMap[y][0];
    }
  
    // Fill dp table
    if (isVertical) {
      for (let y = 1; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const left = x > 0 ? dp[y-1][x-1] : Infinity;
          const up = dp[y-1][x];
          const right = x < width - 1 ? dp[y-1][x+1] : Infinity;
  
          dp[y][x] = energyMap[y][x] + Math.min(left, up, right);
          
          if (left <= up && left <= right) backtrack[y][x] = x - 1;
          else if (up <= left && up <= right) backtrack[y][x] = x;
          else backtrack[y][x] = x + 1;
        }
      }
    } else {
      for (let x = 1; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const up = y > 0 ? dp[y-1][x-1] : Infinity;
          const left = dp[y][x-1];
          const down = y < height - 1 ? dp[y+1][x-1] : Infinity;
  
          dp[y][x] = energyMap[y][x] + Math.min(up, left, down);
          
          if (up <= left && up <= down) backtrack[y][x] = y - 1;
          else if (left <= up && left <= down) backtrack[y][x] = y;
          else backtrack[y][x] = y + 1;
        }
      }
    }
  
    // Find minimum value in last row/column
    let minPos = 0;
    if (isVertical) {
      for (let x = 1; x < width; x++) {
        if (dp[height-1][x] < dp[height-1][minPos]) minPos = x;
      }
    } else {
      for (let y = 1; y < height; y++) {
        if (dp[y][width-1] < dp[minPos][width-1]) minPos = y;
      }
    }
  
    // Construct seam
    const seam = new Array(isVertical ? height : width);
    if (isVertical) {
      seam[height-1] = minPos;
      for (let y = height-1; y > 0; y--) {
        seam[y-1] = backtrack[y][seam[y]];
      }
    } else {
      seam[width-1] = minPos;
      for (let x = width-1; x > 0; x--) {
        seam[x-1] = backtrack[seam[x]][x];
      }
    }
  
    return seam;
  };
  
  export const removeSeam = (imageData, seam, direction = 'vertical') => {
    const { width, height, data } = imageData;
    const isVertical = direction === 'vertical';
    const newImageData = new ImageData(
      isVertical ? width - 1 : width,
      isVertical ? height : height - 1
    );
    
    if (isVertical) {
      for (let y = 0; y < height; y++) {
        let newX = 0;
        for (let x = 0; x < width; x++) {
          if (x === seam[y]) continue;
          for (let c = 0; c < 4; c++) {
            newImageData.data[(y * (width - 1) + newX) * 4 + c] = data[(y * width + x) * 4 + c];
          }
          newX++;
        }
      }
    } else {
      for (let x = 0; x < width; x++) {
        let newY = 0;
        for (let y = 0; y < height; y++) {
          if (y === seam[x]) continue;
          for (let c = 0; c < 4; c++) {
            newImageData.data[(newY * width + x) * 4 + c] = data[(y * width + x) * 4 + c];
          }
          newY++;
        }
      }
    }
    
    return newImageData;
  };