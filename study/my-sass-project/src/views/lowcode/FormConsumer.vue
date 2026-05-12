<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getFormSchemaApi } from "../../api/form";
import type { FormSchema } from "../../types/lowcode";

const loading = ref(true);
const schema = ref<FormSchema | null>(null);
const formRef = ref();

//动态表单的数据载体
const formData = ref<Record<string, any>>({});
//动态校验规则
const formRules = ref<Record<string, any>>({});

const getElComponent = (type: string) => {
    const map: Record<string, string> = {
        'input': 'el-input',
        'select': 'el-select',
        'switch': 'el-switch',
        'date': 'el-date-picker',
    };
    return map[type] || 'el-input';
};

//页面加载时拉取云端协议，并动态初始化formData
onMounted(async () => {
    try {
        const data = await getFormSchemaApi();
        if (data && data.components && data.components.length) {
            schema.value = data;
            // 动态生成 formData 和校验规则
            data.components.forEach((comp: any) => {
                formData.value[comp.field] = comp.type === 'switch' ? false : null;
                if (comp.required) {
                    formRules.value[comp.field] = [
                        { required: true, message: `${comp.label}为必填项`, trigger: comp.type === 'input' ? 'blur' : 'change' }
                    ];
                }
            });
        }
    } catch (error) {
        ElMessage.error('加载表单配置失败');
    }
})

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate((valid: boolean) => {
        if (valid) {
            console.log('提交数据:', formData.value);
            ElMessage.success('提交成功');
        } else {
            ElMessage.warning('请检查表单填写');
        }
    });
};

// 重置表单
const handleReset = () => {
    formRef.value?.resetFields();
};

// 生成模板代码
const generatedCode = ref('');
const showCodeDialog = ref(false);

const generateTemplateCode = () => {
    if (!schema.value) return;

    const { labelWidth, components } = schema.value;

    // 生成 template
    let template = `<template>\n  <el-form label-width=\"${labelWidth}\" label-position=\"top\">\n`;
    components.forEach(comp => {
        template += `    <el-form-item label=\"${comp.label}\" prop=\"${comp.field}\">\n      <${getElComponent(comp.type)} v-model=\"form.${comp.field}\"${comp.props?.placeholder ? ` placeholder=\"${comp.props.placeholder}\"` : ''} />\n    </el-form-item>\n`;
    });
    template += `  </el-form>\n</template>\n\n<script setup>\nimport { ref, reactive } from 'vue';\n\nconst form = ref({\n`;
    components.forEach(comp => {
        template += `  ${comp.field}: ${comp.type === 'switch' ? 'false' : 'null'},\\n`;
    });
    template += `});\n</script>`;

// 将生成的代码展示给用户
generatedCode.value = template;
showCodeDialog.value = true;
};

// 复制代码到剪贴板
const copyCode = async () => {
try {
if (!generatedCode.value) return ElMessage.warning('无可复制内容');
await navigator.clipboard.writeText(generatedCode.value);
ElMessage.success('已复制到剪贴板');
} catch (e) {
ElMessage.error('复制失败');
}
};

<template>
    <div class="form-consumer">
        <el-card class="form-card" v-if="schema">
            <template #header>
                <div class="card-header">
                    <span class="form-title">{{ schema.title }}</span>
                </div>
            </template>

            <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="schema.labelWidth"
                label-position="top">
                <el-form-item v-for="comp in schema.components" :key="comp.id" :label="comp.label" :prop="comp.field">
                    <component :is="getElComponent(comp.type)" v-model="formData[comp.field]" v-bind="comp.props"
                        :placeholder="comp.props?.placeholder || '请输入' + comp.label" />
                </el-form-item>
            </el-form>

            <div class="form-actions">
                <el-button type="primary" @click="handleSubmit">提交</el-button>
                <el-button @click="handleReset">重置</el-button>
                <el-button type="info" @click="generateTemplateCode">生成模板代码</el-button>
            </div>
        </el-card>

        <el-empty v-else description="暂无表单配置" />

        <el-dialog v-model="showCodeDialog" title="生成的模板代码" width="600px">
            <pre class="code-preview">{{ generatedCode }}</pre>
            <template #footer>
                <el-button @click="showCodeDialog = false">关闭</el-button>
                <el-button type="primary" @click="copyCode">复制代码</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.form-consumer {
    padding: 20px;
    min-height: 100vh;
    background: #f5f7fa;
}

.form-card {
    max-width: 800px;
    margin: 0 auto;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-title {
    font-size: 18px;
    font-weight: 600;
}

.form-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.code-preview {
    background: #282c34;
    color: #abb2bf;
    padding: 15px;
    border-radius: 4px;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    font-size: 13px;
    line-height: 1.5;
}
</style>