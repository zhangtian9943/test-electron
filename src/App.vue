<script setup>
import { ref, reactive } from "vue";
import { UploadFilled } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { ElMessage } from "element-plus";

const processing = ref(false);
const form = reactive({
  targetUrl: "",
  data: []
});

const handleFileChange = file => {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 假设Excel文件中有name和phone列
      form.data = jsonData.map(row => ({
        customerId: row.customerId || row.客户号,
        amount: row.amount || row.金额
      }));

      ElMessage.success("Excel文件解析成功");
    } catch (error) {
      ElMessage.error("Excel文件解析失败");
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

const fillForm = async data => {
  try {
    // 创建一个隐藏的iframe来加载目标页面
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // 加载目标页面
    await new Promise(resolve => {
      iframe.onload = resolve;
      iframe.src = form.targetUrl;
    });

    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 获取iframe中的文档
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // 查找并填写表单字段
    const inputs = iframeDoc.querySelectorAll("input");
    for (const input of inputs) {
      if (input.type === "text") {
        // 根据输入框的name、id或placeholder来判断应该填写什么
        const fieldName = (
          input.name ||
          input.id ||
          input.placeholder ||
          ""
        ).toLowerCase();
        if (fieldName.includes("customer") || fieldName.includes("客户")) {
          input.value = data.customerId;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (fieldName.includes("amount") || fieldName.includes("金额")) {
          input.value = data.amount;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }

    // 查找并点击提交按钮
    const submitButton = iframeDoc.querySelector(
      "button[type='submit'], input[type='submit']"
    );
    if (submitButton) {
      submitButton.click();
    }

    // 等待一段时间后移除iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);

    return true;
  } catch (error) {
    console.error("表单填写失败:", error);
    return false;
  }
};

const startProcess = async () => {
  if (!form.targetUrl) {
    ElMessage.warning("请输入目标链接");
    return;
  }

  if (form.data.length === 0) {
    ElMessage.warning("请先上传Excel文件");
    return;
  }

  processing.value = true;
  try {
    for (const item of form.data) {
      ElMessage.info(`正在处理: ${item.customerId}`);
      const success = await fillForm(item);
      if (success) {
        ElMessage.success(`${item.customerId} 处理完成`);
      } else {
        ElMessage.error(`${item.customerId} 处理失败`);
      }
      // 等待一段时间再处理下一条数据
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    ElMessage.success("所有数据处理完成");
  } catch (error) {
    ElMessage.error("处理过程中出现错误");
    console.error(error);
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <div class="container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2>Excel表单自动填写工具</h2>
        </div>
      </template>

      <el-form :model="form" label-width="120px">
        <el-form-item label="目标链接">
          <el-input v-model="form.targetUrl" placeholder="请输入目标链接" />
        </el-form-item>

        <el-form-item label="Excel文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".xlsx,.xls"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传包含客户号和金额的Excel文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="startProcess" :loading="processing">
            开始处理
          </el-button>
        </el-form-item>

        <el-form-item v-if="form.data.length > 0">
          <h3>预览数据</h3>
          <el-table :data="form.data" style="width: 100%">
            <el-table-column prop="customerId" label="客户号" />
            <el-table-column prop="amount" label="金额" />
          </el-table>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.upload-demo {
  width: 100%;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 7px;
}
</style>
