package com.snippethub.api.dto.ai;

public class AIProblemResponse {
    private String title;
    private String description;
    private String problemStatement;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;
    private String solutionTemplate;

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getProblemStatement() { return problemStatement; }
    public String getInputFormat() { return inputFormat; }
    public String getOutputFormat() { return outputFormat; }
    public String getConstraints() { return constraints; }
    public String getSampleInput() { return sampleInput; }
    public String getSampleOutput() { return sampleOutput; }
    public String getSolutionTemplate() { return solutionTemplate; }

    // Setters
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }
    public void setInputFormat(String inputFormat) { this.inputFormat = inputFormat; }
    public void setOutputFormat(String outputFormat) { this.outputFormat = outputFormat; }
    public void setConstraints(String constraints) { this.constraints = constraints; }
    public void setSampleInput(String sampleInput) { this.sampleInput = sampleInput; }
    public void setSampleOutput(String sampleOutput) { this.sampleOutput = sampleOutput; }
    public void setSolutionTemplate(String solutionTemplate) { this.solutionTemplate = solutionTemplate; }
} 